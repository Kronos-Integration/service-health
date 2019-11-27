import process from "process";
import { createAttributes, mergeAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";
import { SendEndpoint, ReceiveEndpoint } from "@kronos-integration/endpoint";

function intervalOpposite(name, action) {
  return {
    opened: endpoint => {
      endpoint.receive(action());
      const interval = setInterval(
        () => endpoint.receive(action()),
        endpoint.owner[name] * 1000
      );

      return () => clearInterval(interval)
    }
  };
}

function endpointWithOpposite(name, owner, intervalName, action) {
  return new ReceiveEndpoint(name, owner, {
    opposite: intervalOpposite(intervalName, action),
    receive: action
  });
}

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
            return endpoint => hcs.removeListener("serviceStateChanged", listener);
          }
        }
      },
/*
      cpu: {
        in: true,
        opposite: intervalOpposite('cpuInterval',()=>process.cpuUsage())
      },
      memory: {
        in: true
        opposite: intervalOpposite('memoryInterval',()=>process.memoryUsage())
      },
      uptime: {
        in: true,
        opposite: intervalOpposite('uptimeInterval',()=>process.uptime() * 1000)
      }
*/
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

  constructor(...args) {
    super(...args);

    this.addEndpoint(
      endpointWithOpposite("cpu", this, "cpuInterval", () => process.cpuUsage())
    );

    this.addEndpoint(
      endpointWithOpposite("memory", this, "memoryInterval", () => process.memoryUsage())
    );

    this.addEndpoint(
      endpointWithOpposite("uptime", this, "uptimeInterval", () => process.uptime() * 1000)
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
