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

class _ServiceProvider {}
class ServiceProvider extends service.ServiceProviderMixin(_ServiceProvider) {}

const sp = new ServiceProvider();

describe('health check serice', () => {
  ServiceHealthCheck.registerWithManager(sp);

  // TODO instance or factory ?
  const hs = sp.services['health-check'];

  //const hs = sp.createServiceInstance('health-check', {});
  hs.start();

  describe('health endpoint', () => {
    it('got response', done => {
      hs.endpoints.state.receive({}).then(r => {
        done();
      })
    });
  });
});
