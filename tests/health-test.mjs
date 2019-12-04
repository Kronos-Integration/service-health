import test from "ava";

import { SendEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import ServiceHealthCheck from "../src/service-health-check.mjs";

async function wait(msecs = 1000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), msecs);
  });
}

async function hct(t, endpointName, expected) {
  const sp = new StandaloneServiceProvider();
  const hcs = await sp.declareService({
    type: ServiceHealthCheck,
    uptimeInterval: 1,
    memoryInterval: 1,
    cpuInterval: 1
  });

  await sp.start();

  const oppositeResponses = [];

  const se = new SendEndpoint("test", {}, {
    connected: hcs.endpoints[endpointName],
    receive: response => {
      oppositeResponses.push(response);
    }
  });

  let response = await se.send();

  if (typeof expected === "function") {
    await expected(t, response);
  } else {
    t.is(response, expected);
  }

  await wait(4000);

  //console.log(endpointName,oppositeResponses);

  response = oppositeResponses[0];

  if (typeof expected === "function") {
    await expected(t, oppositeResponses[0]);
  } else {
    t.is(oppositeResponses[0], expected);
  }
}

hct.title = (providedTitle = "", endpointName, expected) =>
  `health check ${providedTitle} ${endpointName} ${expected}`.trim();

test(hct, "state", true);

test(hct, "memory", (t, response) => {
  t.true(response.heapTotal > 100000, "heapTotal");
  t.true(response.heapUsed > 100000, "heapUsed");
  t.true(response.external > 100000, "external");
  t.true(response.rss > 1000000, "rss");
});

test(hct, "cpu", (t, response) => {
  t.true(response.user > 1000, "user");
  t.true(response.system > 1000, "system");
});

test(hct, "uptime", (t, response) => {
  t.true(response > 0.1, "uptime");
});

test(hct, "resourceUsage", (t, response) => {
  t.true(response.userCPUTime > 1, "userCPUTime");
  t.true(response.systemCPUTime > 1, "systemCPUTime");
});
