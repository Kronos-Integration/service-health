/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  service = require('kronos-service'),
  ServiceProviderMixin = service.ServiceProviderMixin,
  ServiceConfig = service.ServiceConfig,
  ServiceHealthCheck = require('../service.js');

class _ServiceProvider {}
class ServiceProvider extends service.ServiceProviderMixin(_ServiceProvider) {}

const sp = new ServiceProvider();

describe('health check serice', () => {

  ServiceHealthCheck.registerWithManager(sp);

  const hs = sp.createServiceInstance('health-check', {});
  hs.start();

  describe('health endpoint', () => {
    it('got response', done => {
      hs.endpoints.health.receive({}).then(r => {
        done();
      })
    });
  });
});
