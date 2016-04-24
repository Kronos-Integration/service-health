/* jslint node: true, esnext: true */

'use strict';

const path = require('path'),
	process = require('process'),
	Service = require('kronos-service').Service,
	endpoint = require('kronos-endpoint');

/**
 * Collects health state form all components
 * Currently we only check that there no service is in failed state
 */
class ServiceHealthCheck extends Service {

	constructor(config, owner) {
		super(config, owner);

		const hcs = this;

		const sendMemory = new endpoint.SendEndpoint('memory', this, {
			hasBeenConnected() {
					hcs._memoryInterval = setInterval(() => {
						this.receive(process.memoryUsage());
					}, hcs.memoryInterval * 1000);
				},
				hasBeenDisConnected() {
					clearInterval(hcs._memoryInterval);
				}
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('memory', this, {
			opposite: sendMemory
		})).receive = request => Promise.resolve(process.memoryUsage());

		const sendState = new endpoint.SendEndpoint('state', this, {
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
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('state', this, {
			opposite: sendState
		})).receive = request => Promise.resolve(this.isHealthy);

		const sendUptime = new endpoint.SendEndpoint('uptime', this, {
			hasBeenConnected() {
					hcs._uptimeInterval = setInterval(() => {
						this.receive(process.uptime() *
							1000);
					}, hcs.uptimeInterval * 1000);
				},
				hasBeenDisConnected() {
					clearInterval(hcs._uptimeInterval);
				}
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('uptime', this, {
			opposite: sendUptime
		})).receive = request => Promise.resolve(process.uptime() *
			1000);
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

	get configurationAttributes() {
		return Object.assign({
			uptimeInterval: {
				description: 'uptime endpoint send interval in seconds',
				default: 60
			},
			memoryInterval: {
				description: 'memory endpoint send interval in seconds',
				default: 60
			}

		}, super.configurationAttributes);
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
