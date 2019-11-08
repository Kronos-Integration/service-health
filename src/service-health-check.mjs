import process from 'process';
import { createAttributes, mergeAttributes } from 'model-attributes';
import { Service } from '@kronos-integration/service';
import { SendEndpoint, ReceiveEndpoint } from '@kronos-integration/endpoint';

/**
 * Collects health state form all components
 * Currently we only check that there are no service is in failed state
 */
export default class ServiceHealthCheck extends Service {
  /**
   * @return {string} 'health-check'
   */
  static get name() {
    return 'health-check';
  }

  /*
  static get endpoints() {
      return {
      ...super.endpoints,
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
    };
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
    ).receive = async request => process.cpuUsage();

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
    ).receive = async request => process.memoryUsage();

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
    ).receive = request => this.isHealthy;

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
    ).receive = request => process.uptime() * 1000;
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
