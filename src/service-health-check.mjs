import process from "process";
import { createAttributes, mergeAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";

const intervalOptions = {
  didConnect: endpoint => {
    endpoint.send(endpoint.receive());

    const interval = setInterval(
      () => endpoint.send(endpoint.receive()),
      endpoint.owner[endpoint.name + "Interval"] * 1000
    );

    return () => clearInterval(interval);
  }
};

const intervalEndpointDefs = {
  cpu: {
    receive: () => process.cpuUsage(),
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
        didConnect: endpoint => {
          const hcs = endpoint.owner;
          endpoint.send(hcs.isHealthy);
          const listener = () => endpoint.send(hcs.isHealthy);
          hcs.addListener("serviceStateChanged", listener);
          return () => hcs.removeListener("serviceStateChanged", listener);
        }
      },
      ...intervalEndpointDefs
    };
  }

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes(
        Object.entries(intervalEndpointDefs).reduce((all, [name, def]) => {
          all[name + "Interval"] = {
            description: `${name} endpoint send interval (in seconds)`,
            default: 60,
            type: "duration"
          };
          return all;
        }, {})
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
