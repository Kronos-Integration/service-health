import test from "ava";

import { SendEndpoint, ReceiveEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceManager } from "@kronos-integration/service";
import ServiceHealthCheck from "../src/service-health-check.mjs";

test("got state response", async t => {
  const sp = new StandaloneServiceManager();
  const hs = await sp.declareService({ type: ServiceHealthCheck });

  await hs.start();
  const r = await hs.endpoints.state.receive();
  t.is(r, true);
});

test("got memory response", async t => {
  const sp = new StandaloneServiceManager();
  const hs = await sp.declareService({ type: ServiceHealthCheck });

  const re = new SendEndpoint(
    "test",
    {},
    {
      createOpposite: true
    }
  );
  re.connected = hs.endpoints.memory;

  await hs.start();

  const r = await re.receive();

  t.true(r.heapTotal > 100000, "heapTotal");
  t.true(r.heapUsed > 100000, "heapUsed");
  t.true(r.external > 100000, "external");
  t.true(r.rss > 100000, "rss");
});

test("cpu opposite response", async t => {
  const sp = new StandaloneServiceManager();
  const hs = await sp.declareService({ type: ServiceHealthCheck });

  const re = new ReceiveEndpoint(
    "test",
    {},
    {
      createOpposite: true
    }
  );

  let cpuUsage;
  re.receive = message => {
    cpuUsage = message;
  };

  hs.endpoints.cpu.opposite.connected = re;

  await hs.start();

  const r = await hs.endpoints.cpu.receive();

  t.true(r.user > 1000, "user");
  t.true(r.system > 1000, "system");
});

test("state opposite response", async t => {
  const sp = new StandaloneServiceManager();
  const hs = await sp.declareService({ type: ServiceHealthCheck });

  const re = new ReceiveEndpoint(
    "test",
    {},
    {
      createOpposite: true
    }
  );

  let theState = 77;

  re.receive = message => (theState = message);

  hs.endpoints.state.opposite.connected = re;

  await hs.start();

  const r = await hs.endpoints.state.receive();

  t.is(r, true);
});

test("uptime opposite response", async t => {
  const sp = new StandaloneServiceManager();
  const hs = await sp.declareService({ type: ServiceHealthCheck });

  const re = new ReceiveEndpoint(
    "test",
    {},
    {
      createOpposite: true
    }
  );

  let oppositeUptime = -1;

  re.receive = message => (oppositeUptime = message);

  hs.endpoints.uptime.opposite.connected = re;

  await hs.start();

  const uptimeResponse = await hs.endpoints.uptime.receive();
  t.is(Math.abs(oppositeUptime - uptimeResponse) < 10, true);
});
