import { SendEndpoint, ReceiveEndpoint } from '@kronos-integration/endpoint';
import { Service, ServiceProviderMixin } from '@kronos-integration/service';
import ServiceHealthCheck from '../src/service-health-check.mjs';
import test from 'ava';

class ServiceProvider extends ServiceProviderMixin(Service) {}

test('got state response', async t => {
  const sp = new ServiceProvider();
  sp.registerServiceFactory(ServiceHealthCheck);
  const hs = await sp.declareService({ type: 'health-check'});

  await hs.start();
  const r = await hs.endpoints.state.receive();
  t.is(r, true);
});

test('got memory response', async t => {
  const sp = new ServiceProvider();
  sp.registerServiceFactory(ServiceHealthCheck);
  const hs = await sp.declareService({ type: 'health-check'});

  const re = new SendEndpoint(
    'test',
    {},
    {
      createOpposite: true
    }
  );
  re.connected = hs.endpoints.memory;

  await hs.start();

  const r = await re.receive();

  t.is(r.heapTotal > 0, true);
});

test('cpu opposite response', async t => {
  const sp = new ServiceProvider();
  sp.registerServiceFactory(ServiceHealthCheck);
  const hs = await sp.declareService({ type: 'health-check'});

  const re = new ReceiveEndpoint(
    'test',
    {},
    {
      createOpposite: true
    }
  );

  let cpuUsage;
  re.receive = message => {
    cpuUsage = message;
  };

  hs.endpoints.cpu.opposite.connected = re;

  await hs.start();

  const r = await hs.endpoints.cpu.receive();

  t.is(r.user > 0, true);
});

test('state opposite response', async t => {
  const sp = new ServiceProvider();
  sp.registerServiceFactory(ServiceHealthCheck);
  const hs = await sp.declareService({ type: 'health-check'});

  const re = new ReceiveEndpoint(
    'test',
    {},
    {
      createOpposite: true
    }
  );

  let theState = 77;

  re.receive = message => (theState = message);

  hs.endpoints.state.opposite.connected = re;

  await hs.start();

  const r = await hs.endpoints.state.receive();

  t.is(r, true);
});

test('uptime opposite response', async t => {
  const sp = new ServiceProvider();
  sp.registerServiceFactory(ServiceHealthCheck);
  const hs = await sp.declareService({ type: 'health-check'});

  const re = new ReceiveEndpoint(
    'test',
    {},
    {
      createOpposite: true
    }
  );

  let oppositeUptime = -1;

  re.receive = message => (oppositeUptime = message);

  hs.endpoints.uptime.opposite.connected = re;

  await hs.start();

  const uptimeResponse = await hs.endpoints.uptime.receive();
  t.is(Math.abs(oppositeUptime - uptimeResponse) < 10, true);
});
