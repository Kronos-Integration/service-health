/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	ServiceKOA = require('kronos-service-koa').ServiceKOA,
	route = require('koa-route');

class ServiceHealthCheck extends ServiceKOA {

	constructor(config) {
		super(config);
	}

	static get type() {
		return "health-check";
	}

	get type() {
		return ServiceHealtCheck.type;
	}

	get autostart() {
		return true;
	}

	get path() {
		return "/health";
	}

	get url() {
		return `http://localhost:${this.port}${this.path}`;
	}

	_start() {
		return super.strart().then(f => {
			this.koa.use(route.get(this.path, ctx => {
				// TODO always ok ?
				ctx.body = "OK";
			}));
		});
	}

}

module.exports.registerWithManager = function (manager) {
	manager.serviceDeclare(ServiceHealthCheck);

	const healthCheckService = manager.serviceDeclare('koa', {
		port: 9856
	});

};
