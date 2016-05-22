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

		const sendCPU = new endpoint.SendEndpoint('cpu', this, {
			hasBeenOpened() {
					hcs.trace({
						endpoint: this,
						state: 'open'
					});
					hcs._cpuInterval = setInterval(() => {
						this.receive(process.cpuUsage());
					}, hcs.cpuInterval * 1000);
					this.receive(process.cpuUsage());
				},
				willBeClosed() {
					hcs.trace({
						endpoint: this,
						state: 'close'
					});
					clearInterval(hcs._cpuInterval);
				}
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('cpu', this, {
			opposite: sendCPU
		})).receive = request => Promise.resolve(process.cpuUsage());


		const sendMemory = new endpoint.SendEndpoint('memory', this, {
			hasBeenOpened() {
					hcs.trace({
						endpoint: this,
						state: 'open'
					});
					hcs._memoryInterval = setInterval(() => {
						this.receive(process.memoryUsage());
					}, hcs.memoryInterval * 1000);
				},
				willBeClosed() {
					hcs.trace({
						endpoint: this,
						state: 'close'
					});

					clearInterval(hcs._memoryInterval);
				}
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('memory', this, {
			opposite: sendMemory
		})).receive = request => Promise.resolve(process.memoryUsage());

		const sendState = new endpoint.SendEndpoint('state', this, {
			hasBeenOpened() {
					hcs.trace({
						endpoint: this,
						state: 'open'
					});
					// immediate send current state
					this.receive(hcs.isHealthy);

					hcs._serviceStateChangedListener = () => {
						this.receive(hcs.isHealthy);
					};
					hcs.addListener('serviceStateChanged', hcs._serviceStateChangedListener);
				},
				willBeClosed() {
					hcs.trace({
						endpoint: this,
						state: 'close'
					});

					hcs.removeListener('serviceStateChanged', hcs._serviceStateChangedListener);
				}
		});

		this.addEndpoint(new endpoint.ReceiveEndpoint('state', this, {
			opposite: sendState
		})).receive = request => Promise.resolve(this.isHealthy);

		const sendUptime = new endpoint.SendEndpoint('uptime', this, {
			hasBeenOpened() {
					hcs.trace({
						endpoint: this,
						state: 'open'
					});

					hcs._uptimeInterval = setInterval(() => {
						this.receive(process.uptime() *
							1000);
					}, hcs.uptimeInterval * 1000);
				},
				willBeClosed() {
					hcs.trace({
						endpoint: this,
						state: 'close'
					});

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
			type: sf.name,
			name: sf.name
		}));
