/* jslint node: true, esnext: true */

"use strict";

const path = require('path'),
	service = require('kronos-service'),
	route = require('koa-route');

module.exports.registerWithManager = function (manager) {
	const adminService = manager.serviceDeclare('koa', {
		name: 'health-check',
		autostart: true,

		get path() {
			return "/health";
		},

		get url() {
			return `http://localhost:${this.port}/${this.path}`;
		}
	});

	adminService.koa.use(route.get(adminService.path, ctx => {
		// TODO always ok ?
		ctx.body = "OK";
	}));
};
