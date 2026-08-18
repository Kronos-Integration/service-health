import test from "ava";
import { setTimeout } from "node:timers/promises";

import { SendReceiveEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceHealth } from "@kronos-integration/service-health";

test("heartbeat", async t => {
  const sp = new StandaloneServiceProvider();
  const hcs = await sp.declareService({
    type: ServiceHealth,
    heartbeatInterval: 0.5
  });

  const ep1 = new SendReceiveEndpoint("ep1", sp, {
    receive: response => {
      console.log("receive", response);
      ep1.send("ok");
    }
  });

  hcs.endpoints.heartbeat.addConnection(ep1);
  t.true(ep1.isOpen);

  await sp.start();

  t.true(ep1.isConnected(hcs.endpoints.heartbeat));

  //ep1.send("hello");
  await setTimeout(2000);

  await sp.stop();
});
