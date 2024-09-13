import process from "process";
import { createAttributes, mergeAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";

const intervalOptions = {
  multi: true,
  didConnect: (endpoint, other) => {
    if (other.direction === "inout") {
      endpoint.send(endpoint.receive());
      const interval = setInterval(
        () => endpoint.send(endpoint.receive()),
        endpoint.owner[endpoint.name + "Interval"] * 1000
      );

      return () => clearInterval(interval);
    }
  }
};

let lastCpuUsage;

const intervalEndpointDefs = {
  cpu: {
    receive: () => { 
      lastCpuUsage = process.cpuUsage(lastCpuUsage);
      return lastCpuUsage;
    },
    ...intervalOptions
  },
  availableMemory: {
    receive: () => process.availableMemory(),
    ...intervalOptions
  },
  constrainedMemory: {
    receive: () => process.constrainedMemory(),
    ...intervalOptions
  },
  memory: {
    receive: () => process.memoryUsage(),
    ...intervalOptions
  },
  uptime: {
    receive: () => process.uptime(),
    ...intervalOptions
  },
  resourceUsage: {
    receive: () => process.resourceUsage(),
    ...intervalOptions
  }
};

/**
 * Collects health state form all components
 * Currently we only check that there is no service is in failed state
 */
export class ServiceHealth extends Service {
  /**
   * @return {string} 'health'
   */
  static get name() {
    return "health";
  }

  static get endpoints() {
    return {
      ...super.endpoints,
      state: {
        multi: true,
        receive: "isHealthy",
        didConnect: (endpoint, other) => {
          if (other.direction === "inout") {
            const hcs = endpoint.owner;
            endpoint.send(hcs.isHealthy);
            const listener = () => endpoint.send(hcs.isHealthy);
            hcs.owner.addListener("serviceStateChanged", listener);
            return () => hcs.owner.removeListener("serviceStateChanged", listener);
          }
        }
      },
      ...intervalEndpointDefs
    };
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes(
        Object.fromEntries(
          Object.entries(intervalEndpointDefs).map(([name, def]) => [
            name + "Interval",
            {
              description: `${name} endpoint send interval (in seconds)`,
              default: 30,
              type: "duration"
            }
          ])
        )
      ),
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
    return Object.values(this.owner.services).find(
      service => service.state === "failed"
    )
      ? false
      : true;
  }
}

export default ServiceHealth;
