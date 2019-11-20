import test from "ava";

import { ReceiveEndpoint } from "@kronos-integration/endpoint";
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
   // logLevel: "trace"
  });

  const endpoint = hcs.endpoints[endpointName];

  await hcs.start();
  const response = await endpoint.receive();

  if (typeof expected === "function") {
    await expected(t, response);
  } else {
    t.is(response, expected);
  }

  let oppositeResponse;

  const re = new ReceiveEndpoint(
    "test",
    {},
    {
      opposite: {
        // connected: endpoint,
        receive: response => {
          console.log(response);
          oppositeResponse = response;
        }
      }
    }
  );

  re.opposite.connected = endpoint;

  await wait(1000);
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
  t.true(response > 100, "uptime");
});
