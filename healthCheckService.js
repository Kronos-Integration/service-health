/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

module.exports.registerWithManager = function (manager) {
	const adminService = manager.serviceDeclare('koa', {
		name: 'health-check',
		autostart: true
	});

	adminService.koa.use(route.get('/health', ctx => {
		// TODO always ok ?
		ctx.body = "OK";
	}));
};
