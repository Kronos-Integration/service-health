const path = require('path'),
  process = require('process');

import { createAttributes, mergeAttributes } from 'model-attributes';
import { Service } from 'kronos-service';
import { SendEndpoint, ReceiveEndpoint } from 'kronos-endpoint';

/**
 * Collects health state form all components
 * Currently we only check that there are no service is in failed state
 */
export class ServiceHealthCheck extends Service {
  /**
   * @return {string} 'health-check'
   */
  static get name() {
    return 'health-check';
  }

  /*
  static get endpoints() {
    return Object.assign(
      {
        cpu: {
          in: true
        },
        memory: {
          in: true
        },
        state: {
          in: true
        },
        uptime: {
          in: true
        }
      },
      Service.endpoints
    );
  }
*/

  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        uptimeInterval: {
          description: 'uptime endpoint send interval (in seconds)',
          default: 60,
          type: 'duration'
        },
        memoryInterval: {
          description: 'memory endpoint send interval (in seconds)',
          default: 60,
          type: 'duration'
        },
        cpuInterval: {
          description: 'cpu endpoint send interval (in seconds)',
          default: 60,
          type: 'duration'
        }
      }),
      Service.configurationAttributes
    );
  }

  constructor(config, owner) {
    super(config, owner);

    const hcs = this;

    const sendCPU = new SendEndpoint('cpu', this, {
      hasBeenOpened() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'open'
        });
        hcs._cpuInterval = setInterval(() => {
          this.receive(process.cpuUsage());
        }, hcs.cpuInterval * 1000);
        this.receive(process.cpuUsage());
      },
      willBeClosed() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'close'
        });
        clearInterval(hcs._cpuInterval);
      }
    });

    this.addEndpoint(
      new ReceiveEndpoint('cpu', this, {
        opposite: sendCPU
      })
    ).receive = request => Promise.resolve(process.cpuUsage());

    const sendMemory = new SendEndpoint('memory', this, {
      hasBeenOpened() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'open'
        });
        hcs._memoryInterval = setInterval(() => {
          this.receive(process.memoryUsage());
        }, hcs.memoryInterval * 1000);
      },
      willBeClosed() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'close'
        });

        clearInterval(hcs._memoryInterval);
      }
    });

    this.addEndpoint(
      new ReceiveEndpoint('memory', this, {
        opposite: sendMemory
      })
    ).receive = request => Promise.resolve(process.memoryUsage());

    const sendState = new SendEndpoint('state', this, {
      hasBeenOpened() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'open'
        });
        // immediate send current state
        this.receive(hcs.isHealthy);

        hcs._serviceStateChangedListener = () => {
          this.receive(hcs.isHealthy);
        };
        hcs.addListener(
          'serviceStateChanged',
          hcs._serviceStateChangedListener
        );
      },
      willBeClosed() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'close'
        });

        hcs.removeListener(
          'serviceStateChanged',
          hcs._serviceStateChangedListener
        );
      }
    });

    this.addEndpoint(
      new ReceiveEndpoint('state', this, {
        opposite: sendState
      })
    ).receive = request => Promise.resolve(this.isHealthy);

    const sendUptime = new SendEndpoint('uptime', this, {
      hasBeenOpened() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'open'
        });

        this.receive(process.uptime() * 1000);

        hcs._uptimeInterval = setInterval(
          () => this.receive(process.uptime() * 1000),
          hcs.uptimeInterval * 1000
        );
      },
      willBeClosed() {
        hcs.trace({
          endpoint: this.identifier,
          state: 'close'
        });

        clearInterval(hcs._uptimeInterval);
      }
    });

    this.addEndpoint(
      new ReceiveEndpoint('uptime', this, {
        opposite: sendUptime
      })
    ).receive = request => Promise.resolve(process.uptime() * 1000);
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
      n => services[n].state === 'failed'
    );
    return failedService ? false : true;
  }
}

export function registerWithManager(manager) {
  return manager.registerServiceFactory(ServiceHealthCheck).then(sr =>
    manager.declareService({
      type: sr.name,
      name: sr.name
    })
  );
}
