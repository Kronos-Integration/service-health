/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

module.exports.registerWithManager = function (manager) {
	const healthCheckService = manager.serviceDeclare('koa', {
		name: 'health-check',
		autostart: true,
		port: 9856,

		get path() {
			return "/health";
		},

		get url() {
			return `http://localhost:${this.port}${this.path}`;
		}
	});

	healthCheckService.info({
		url: healthCheckService.url
	});

	healthCheckService.koa.use(route.get(healthCheckService.path, ctx => {
		// TODO always ok ?
		ctx.body = "OK";
	}));
};
