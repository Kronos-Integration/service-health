/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	Service = require('kronos-service').Service,
	endpoint = require('kronos-endpoint');

/**
 * collects health state form all components
 * Currently we only check there no service is in failed state
 */
class ServiceHealthCheck extends Service {

	constructor(config, owner) {
		super(config, owner);

		this.addEndpoint(new endpoint.ReceiveEndpoint('state', this)).receive = request => {
			return Promise.resolve(this.isHealthy);
		};

		this.addEndpoint(new endpoint.SendEndpoint('broadcast', this));
	}

	static get name() {
		return "health-check";
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

	_start() {
		let lastIsHealthy = this.isHealthy;

		this._serviceStateChangedListener = (service, oldState, newState) => {
			const currentIsHealthy = this.isHealthy;
			if (currentIsHealthy != lastIsHealthy) {
				lastIsHealthy = currentIsHealthy;
				if (this.endpoint.broadcast.isConnected) {
					this.endpoint.broadcast.receive(currentIsHealthy);
				}
			}
		};

		this.owner.addListener('serviceStateChanged', this._serviceStateChangedListener);
		return super._start();
	}

	_stop() {
		this.owner.removeListener('serviceStateChanged', this._serviceStateChangedListener);
		this._serviceStateChangedListener = undefined;
		return super._stop();
	}
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceHealthCheck).then(sf =>
		manager.declareService({
			'type': sf.name,
			'name': sf.name
		}));
