/* global describe, it, xit, before, beforeEach, after, afterEach */
/* jslint node: true, esnext: true */

'use strict';

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  {
    SendEndpoint, ReceiveEndpoint
  } = require('kronos-endpoint'),
  {
    Service, ServiceProviderMixin
  } = require('kronos-service'),
  {
    ServiceHealthCheck, registerWithManager
  } = require('../dist/module.js');

class ServiceProvider extends ServiceProviderMixin(Service) {}

const sp = new ServiceProvider();

describe('health check service', () => {
  it('got state response', () =>
    registerWithManager(sp).then(() => {
      const hs = sp.services['health-check'];
      return hs.start().then(() => hs.endpoints.state.receive({}).then(r => assert.equal(r, true)));
    })
  );

  it('memory', () =>
    registerWithManager(sp).then(() => {
      const hs = sp.services['health-check'];
      const re = new SendEndpoint('test', {
        name: 'a'
      }, {
        createOpposite: true
      });

      re.connected = hs.endpoints.memory;

      return hs.start().then(() => re.receive({}).then(response => assert.isAbove(response.heapTotal, 10000)));
    })
  );

  it('cpu opposite', () =>
    registerWithManager(sp).then(() => {
      const hs = sp.services['health-check'];
      const re = new ReceiveEndpoint('test', {
        name: 'a'
      }, {
        createOpposite: true
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
    registerWithManager(sp).then(() => {
      const hs = sp.services['health-check'];
      const re = new ReceiveEndpoint('test', {
        name: 'a'
      }, {
        createOpposite: true
      });

      let theState = 77;

      re.receive = message => {
        theState = message;
      };

      hs.endpoints.state.opposite.connected = re;

      return hs.start().then(() => hs.endpoints.state.receive({}).then(r => assert.equal(theState, true)));
    })
  );

  /*
    it('uptime opposite', () =>
      ServiceHealthCheck.registerWithManager(sp).then(() => {
        const hs = sp.services['health-check'];

        const re = new endpoint.ReceiveEndpoint('test', {
          name: 'a'
        }, {
          createOpposite: true
        });

        let theState = 77;

        hs.endpoints.uptime.opposite.connected = re;

        re.receive = message => {
          theState = message;
        };

        return hs.start().then(() => hs.endpoints.uptime.receive({}).then(r => assert.equal(theState, true)));
      })
    );
  */
});
