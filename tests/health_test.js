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

describe('health check service', () => {
  it('got response', done => {
    ServiceHealthCheck.registerWithManager(sp).then(() => {
      const hs = sp.createServiceFactoryInstanceFromConfig({
        type: 'health-check'
      });
      hs.start();
      hs.endpoints.state.receive({}).then(r => done())
    });
  });
});
