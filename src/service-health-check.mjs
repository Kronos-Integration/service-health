import process from "process";
import { createAttributes, mergeAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";

const intervalOpposite = {
  opened: endpoint => {
    const o = endpoint.opposite;
    endpoint.receive(o.receive());

    const interval = setInterval(
      () => endpoint.receive(o.receive()),
      endpoint.owner[endpoint.name + 'Interval'] * 1000
    );

    return () => clearInterval(interval)
  }
};

/**
 * Collects health state form all components
 * Currently we only check that there are no service is in failed state
 */
export default class ServiceHealthCheck extends Service {
  /**
   * @return {string} 'health-check'
   */
  static get name() {
    return "health-check";
  }

  static get endpoints() {
    return {
      ...super.endpoints,
      state: {
        receive: "isHealthy",
        opposite: {
          opened: endpoint => {
            const hcs = endpoint.owner;
            endpoint.receive(hcs.isHealthy);
            const listener = () => endpoint.receive(hcs.isHealthy);
            hcs.addListener("serviceStateChanged", listener);
            return () => hcs.removeListener("serviceStateChanged", listener);
          }
        }
      },
      cpu: {
        opposite: intervalOpposite,
        receive: () => process.cpuUsage()
      },
      memory: {
        opposite: intervalOpposite,
        receive: () => process.memoryUsage()
      },
      uptime: {
        opposite: intervalOpposite,
        receive: () => process.uptime()
      },
    };
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        uptimeInterval: {
          description: "uptime endpoint send interval (in seconds)",
          default: 60,
          type: "duration"
        },
        memoryInterval: {
          description: "memory endpoint send interval (in seconds)",
          default: 60,
          type: "duration"
        },
        cpuInterval: {
          description: "cpu endpoint send interval (in seconds)",
          default: 60,
          type: "duration"
        }
      }),
      Service.configurationAttributes
    );
  }

  /**
   * Start immediate
   * @return {boolean} true
   */
  get autostart() {
    return true;
  }

  /**
   * @return {boolean} true if there are no failed services
   */
  get isHealthy() {
    return Object.values(this.owner.services).
      find(service => service.state === "failed")
      ? false : true;
  }
}
