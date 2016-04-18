/* jslint node: true, esnext: true */

'use strict';

const path = require('path'),
	process = require('process'),
	Service = require('kronos-service').Service,
	endpoint = require('kronos-endpoint');

/**
 * Collects health state form all components
 * Currently we only check there no service is in failed state
 */
class ServiceHealthCheck extends Service {

	constructor(config, owner) {
		super(config, owner);

		this.addEndpoint(new endpoint.ReceiveEndpoint('state', this)).receive = request => Promise.resolve(this.isHealthy);
		this.addEndpoint(new endpoint.ReceiveEndpoint('memory', this)).receive = request => Promise.resolve(process.memoryUsage());
		this.addEndpoint(new endpoint.ReceiveEndpoint('uptime', this)).receive = request => Promise.resolve(process.uptime() *
			1000);

		const hcs = this;

		this.addEndpoint(new endpoint.SendEndpoint('stateBroadcast', this, {
			hasBeenConnected() {
					// immediate send current state
					this.receive(hcs.isHealthy);

					hcs._serviceStateChangedListener = () => {
						this.receive(hcs.isHealthy);
					};
					hcs.addListener('serviceStateChanged', hcs._serviceStateChangedListener);
				},
				hasBeenDisConnected() {
					hcs.removeListener('serviceStateChanged', hcs._serviceStateChangedListener);
				}
		}));
	}

	static get name() {
		return 'health-check';
	}

	get type() {
		return ServiceHealthCheck.name;
	}

	get autostart() {
		return true;
	}

	get isHealthy() {
		const services = this.owner.services;
		const failedService = Object.keys(services).find(n => services[n].state === 'failed');
		return failedService ? false : true;
	}
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceHealthCheck).then(sf =>
		manager.declareService({
			'type': sf.name,
			'name': sf.name
		}));
