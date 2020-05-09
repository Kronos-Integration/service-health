import test from "ava";

import { SendEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceHealthCheck } from "@kronos-integration/service-health-check";

async function wait(msecs = 1000) {
  return new Promise((resolve, reject) => setTimeout(() => resolve(), msecs));
}

async function hct(t, endpointName, expected) {
  const sp = new StandaloneServiceProvider();
  const hcs = await sp.declareService({
    type: ServiceHealthCheck,
    uptimeInterval: 1,
    memoryInterval: 1,
    cpuInterval: 1,
    resourceUsageInterval: 1
  });

  await sp.start();

  const responses = [];

  const se = new SendEndpoint("test-receice", sp, {
    connected: hcs.endpoints[endpointName],
    receive: response => {
      responses.push(response);
    }
  });

  // 2nd. endpoint will not receive anything
  const se2 = new SendEndpoint("test", sp, {
    connected: hcs.endpoints[endpointName]
  });

  await wait(4000);

  if (typeof expected === "function") {
    await expected(t, responses);
  } else {
    t.is(responses[0], expected);
  }
}

hct.title = (providedTitle = "", endpointName, expected) =>
  `health check ${providedTitle} ${endpointName} ${expected}`.trim();

test(hct, "state", true);

test(hct, "memory", (t, responses) => {
  t.true(responses.length > 2);
  const response = responses[0];
  t.true(response.heapTotal > 100000, "heapTotal");
  t.true(response.heapUsed > 100000, "heapUsed");
  t.true(response.external > 100000, "external");
  t.true(response.rss > 1000000, "rss");
});

test(hct, "cpu", (t, responses) => {
  t.true(responses.length > 2);
  const response = responses[0];
  t.true(response.user > 1000, "user");
  t.true(response.system > 1000, "system");
});

test(hct, "uptime", (t, responses) => {
  t.true(responses.length > 2);
  const response = responses[0];
  t.true(response > 0.1, "uptime");
});

test(hct, "resourceUsage", (t, responses) => {
  t.true(responses.length > 2);
  const response = responses[0];
  t.true(response.userCPUTime > 1, "userCPUTime");
  t.true(response.systemCPUTime > 1, "systemCPUTime");
});
