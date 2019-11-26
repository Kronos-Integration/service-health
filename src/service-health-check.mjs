import process from "process";
import { createAttributes, mergeAttributes } from "model-attributes";
import { Service } from "@kronos-integration/service";
import { SendEndpoint, ReceiveEndpoint } from "@kronos-integration/endpoint";

function intervalOpposite(name, action) {
  return {
    hasBeenOpened: endpoint => {
      console.log("hasBeenOpened", endpoint);

      endpoint.receive(action());
      return setInterval(
        () => endpoint.receive(action()),
        endpoint.owner[name] * 1000
      );
    },
    willBeClosed: (endpoint, interval) => clearInterval(interval)
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

  /*
  static get endpoints() {
    return {
      ...super.endpoints,
      cpu: {
        in: true,
        opposite: intervalOpposite('cpuInterval',()=>process.cpuUsage())
      },
      memory: {
        in: true
        opposite: intervalOpposite('memoryInterval',()=>process.memoryUsage())
      },
      state: {
        in: true,
        receive: "isHealthy"
      },
      uptime: {
        in: true,
        opposite: intervalOpposite('uptimeInterval',()=>process.uptime() * 1000)
      }
    };
  }*/

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

    const hcs = this;

    const sendState = new SendEndpoint("state", this, {
      hasBeenOpened(endpoint) {
        endpoint.receive(hcs.isHealthy);
        hcs._serviceStateChangedListener = () =>
          endpoint.receive(hcs.isHealthy);

        hcs.addListener(
          "serviceStateChanged",
          hcs._serviceStateChangedListener
        );
      },
      willBeClosed(endpoint) {
        hcs.removeListener(
          "serviceStateChanged",
          hcs._serviceStateChangedListener
        );
      }
    });

    this.addEndpoint(
      new ReceiveEndpoint("state", this, {
        opposite: sendState,
        receive: request => this.isHealthy
      })
    );
  }

  /**
   * Start immediate
   * @return {boolean} true
   */
  get autostart() {
    return true;
  }

  get isHealthy() {
    const services = this.owner.services;
    const failedService = Object.keys(services).find(
      n => services[n].state === "failed"
    );
    return failedService ? false : true;
  }
}
