import { setTimeout } from "timers/promises";
import { SendEndpoint } from "@kronos-integration/endpoint";
import { StandaloneServiceProvider } from "@kronos-integration/service";
import { ServiceHealthCheck } from "@kronos-integration/service-health";

async function exec() {
  const sp = new StandaloneServiceProvider();
  const hcs = await sp.declareService({
    type: ServiceHealthCheck,
    uptimeInterval: 1
  });

  new SendEndpoint("r", sp, {
    connected: hcs.endpoints.uptime,
    receive: response => responses.push(response)
  });

  await sp.start();

  //await setTimeout(4000);
}

exec();
