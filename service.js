/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	Service = require('kronos-service').Service,
	endpoint = require('kronos-endpoint');

/**
 * collects health state form all components
 * Currently we only check tha no service is in failed state
 */
class ServiceHealthCheck extends Service {

	constructor(config, owner) {
		super(config, owner);

		this.addEndpoint(new endpoint.ReceiveEndpoint('state', this)).receive = request => {
			const failedService = Object.keys(this.owner.services).find(n => this.owner.services[n].state === 'failed');
			return Promise.resolve(failedService ? false : true);
		};

		// TODO how to broadcast health state
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
}

module.exports.registerWithManager = manager =>
	manager.registerServiceFactory(ServiceHealthCheck).then(sf =>
		manager.declareService({
			'type': sf.name,
			'name': sf.name
		}));
