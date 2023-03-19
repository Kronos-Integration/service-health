import test from "ava";
import { setTimeout } from "timers/promises";
import { SendEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceHealth } from "@kronos-integration/service-health";

async function hct(t, endpointName, expected) {
  const sp = new StandaloneServiceProvider();
  const hcs = await sp.declareService({
    type: ServiceHealth,
    uptimeInterval: 1,
    memoryInterval: 1,
    cpuInterval: 1,
    resourceUsageInterval: 1
  });

  const receivers = ["test-receice1", "test-receice2"].map(name => {
    const responses = [];
    return {
      name,
      responses,
      endpoint: new SendEndpoint(name, sp, {
        connected: hcs.endpoints[endpointName],
        receive: response => responses.push(response)
      })
    };
  });

  await sp.start();

  await setTimeout(4000);

  for (const r of receivers) {
    if (typeof expected === "function") {
      await expected(t, r.responses, `responses ${r.name}`);
    } else {
      t.is(r.responses[0], expected, `responses ${r.name}`);
    }
  }
}

hct.title = (providedTitle = "", endpointName, expected) =>
  `health check ${providedTitle} ${endpointName} ${expected}`.trim();

test(hct, "state", true);

test(hct, "memory", (t, responses) => {
  t.true(responses.length > 2, `responses # > 2 only ${responses.length}`);
  const response = responses[0];
  t.true(response.heapTotal > 100000, "heapTotal");
  t.true(response.heapUsed > 100000, "heapUsed");
  t.true(response.external > 100000, "external");
  t.true(response.rss > 1000000, "rss");
});

test(hct, "cpu", (t, responses) => {
  t.true(responses.length > 2, `responses # > 2 only ${responses.length}`);
  const response = responses[0];
  t.true(response.user > 1000, "user");
  t.true(response.system > 1000, "system");
});

test(hct, "uptime", (t, responses) => {
  t.true(responses.length > 2, `responses # > 2 only ${responses.length}`);
  const response = responses[0];
  t.true(response > 0.1, "uptime");
});

test(hct, "resourceUsage", (t, responses) => {
  t.true(responses.length > 2, `responses # > 2 only ${responses.length}`);
  const response = responses[0];
  t.true(response.userCPUTime > 1, "userCPUTime");
  t.true(response.systemCPUTime > 1, "systemCPUTime");
});
