/* global describe, it */
/* jslint node: true, esnext: true */

'use strict';

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  endpoint = require('kronos-endpoint'),
  service = require('kronos-service'),
  ServiceConfig = service.ServiceConfig,
  ServiceHealthCheck = require('../service.js');

class ServiceProvider extends service.ServiceProviderMixin(service.Service) {}

const sp = new ServiceProvider();

describe('health check service', () => {
  it('got state response', () =>
    ServiceHealthCheck.registerWithManager(sp).then(() => {
      const hs = sp.createServiceFactoryInstanceFromConfig({
        type: 'health-check'
      }, sp);
      return hs.start().then(() => hs.endpoints.state.receive({}).then(r => assert.equal(r, true)));
    })
  );

  it('memory', () =>
    ServiceHealthCheck.registerWithManager(sp).then(() => {
      const hs = sp.createServiceFactoryInstanceFromConfig({
        type: 'health-check'
      }, sp);

      const re = new endpoint.SendEndpoint('test', {
        name: 'a'
      });

      re.connected = hs.endpoints.memory;

      return hs.start().then(() => re.receive({}).then(response => assert.isAbove(response.heapTotal, 10000)));
    })
  );

  it('cpu opposite', () =>
    ServiceHealthCheck.registerWithManager(sp).then(() => {
      const hs = sp.createServiceFactoryInstanceFromConfig({
        type: 'health-check'
      }, sp);

      const re = new endpoint.ReceiveEndpoint('test', {
        name: 'a'
      });

      let cpuUsage;
      re.receive = message => {
        cpuUsage = message;
      };

      hs.endpoints.cpu.opposite.connected = re;

      return hs.start().then(() => hs.endpoints.cpu.receive({}).then(r => assert.isAbove(cpuUsage.user, 100)));
    })
  );

  it('state opposite', () =>
    ServiceHealthCheck.registerWithManager(sp).then(() => {
      const hs = sp.createServiceFactoryInstanceFromConfig({
        type: 'health-check'
      }, sp);

      const re = new endpoint.ReceiveEndpoint('test', {
        name: 'a'
      });

      let theState = 77;

      re.receive = message => {
        theState = message;
      };

      hs.endpoints.state.opposite.connected = re;

      return hs.start().then(() => hs.endpoints.state.receive({}).then(r => assert.equal(theState, true)));
    })
  );
});
