/* global describe, it */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  service = require('kronos-service'),
  ServiceConfig = service.ServiceConfig,
  ServiceHealthCheck = require('../service.js');

class ServiceProvider extends service.ServiceProviderMixin(service.Service) {}

const sp = new ServiceProvider();

describe('health check serice', () => {
  ServiceHealthCheck.registerWithManager(sp);

  const hs = sp.createServiceFactoryInstanceFromConfig({
    type: 'health-check',
    port: 1234
  });

  hs.start();

  describe('health endpoint', () => {
    it('got response', done => {
      hs.endpoints.state.receive({}).then(r => {
        done();
      })
    });
  });
});
