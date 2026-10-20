const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
for (const name of ['Store','BleService','DeviceService','AlertService','HapticService','AudioService','DemoWearable']) require(path.resolve(__dirname, `../dist/services/${name}.js`));
const { Store, BleService, DeviceService, AlertService, HapticService, AudioService, DemoWearable } = globalThis.CCEW;
function memory() {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key,value) => data.set(key,value) };
}
function setup({ storage = memory(), now = 1800000000000, clear = true } = {}) {
  let clock = now;
  const store = new Store({ storage, now: () => clock });
  if (clear) { store.state.events = []; store.save(); }
  const ble = new BleService(store), device = new DeviceService(store,ble), alerts = new AlertService(store,ble);
  const haptics = new HapticService(store,ble,alerts), audio = new AudioService(store,ble);
  const demo = new DemoWearable(store,ble,device,alerts,haptics);
  const tick = () => { ble.tick(); demo.tick(); alerts.tick(); audio.tick(); haptics.tick(); };
  const advance = ms => { for (let elapsed = 0; elapsed < ms;) { const step = Math.min(250,ms-elapsed); clock += step; elapsed += step; tick(); } };
  return { store, storage, ble, device, alerts, haptics, audio, demo, advance, tick, now: () => clock };
}
test('acceptance 1: disconnect during metadata transfer queues a single event until reconnect', () => {
  const a = setup(), e = a.demo.pressButton(); a.advance(250);
  assert.equal(e.transfer.status,'transferring'); a.ble.disconnect(); a.advance(3000);
  assert.equal(e.receivedAt,null); assert.equal(a.alerts.visible().length,0);
  a.ble.connect(); a.advance(4000);
  assert.notEqual(e.receivedAt,null); assert.equal(a.alerts.visible().length,1);
  assert.equal(a.alerts.detect('manual',{id:e.id}),e); assert.equal(a.store.state.events.length,1);
});
test('acceptance 2: disconnect during audio transfer preserves chunks and resumes without duplicates', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(21500);
  assert.equal(e.audio.status,'transferring'); assert.ok(e.audio.receivedChunks.length > 0 && e.audio.receivedChunks.length < 8);
  a.ble.disconnect(); const chunks = [...e.audio.receivedChunks]; a.advance(10000);
  assert.equal(e.audio.status,'paused'); assert.deepEqual(e.audio.receivedChunks,chunks);
  a.ble.connect(); a.advance(8000);
  assert.equal(e.audio.status,'ready'); assert.deepEqual(e.audio.receivedChunks,[0,1,2,3,4,5,6,7]);
  a.ble.disconnect(); assert.equal(e.audio.status,'ready');
});
test('acceptance 3: offline contact reply remains pending until a matching wearable confirmation', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(1000); a.ble.disconnect();
  assert.equal(a.alerts.acknowledge(e.id,'taylor'),true); a.tick();
  assert.equal(e.responder.name,'Taylor Brooks'); assert.equal(e.haptic.status,'pending');
  a.ble.connect(); a.advance(2000); assert.equal(e.haptic.status,'sent'); assert.equal(e.haptic.confirmedAt,null);
  assert.equal(a.haptics.confirm(e.id,'wrong-command',true),false);
  assert.equal(a.demo.confirmHaptic(e.id,true),true); assert.equal(e.haptic.status,'successful');
  assert.equal(a.demo.confirmHaptic(e.id,true),false);
});
test('acceptance 4: brief skin-contact loss is debounced, stable loss generates one removal event', () => {
  const a = setup(); a.demo.briefContactLoss(); a.advance(2500);
  assert.equal(a.store.state.events.length,0); assert.equal(a.device.getStatus().worn,true);
  a.demo.setContact(false); a.advance(1000); a.demo.setContact(false); a.advance(500);
  assert.equal(a.store.state.events.filter(e => e.type === 'removal').length,1);
  a.advance(4000); assert.equal(a.store.state.events.length,1);
});
test('acceptance 5: cancelled fall check-in creates no alert', () => {
  const a = setup(); a.demo.startFall(); a.advance(2000);
  assert.equal(a.demo.cancelFall(),true); a.advance(12000);
  assert.equal(a.store.state.events.length,0); assert.equal(a.store.state.fallHistory[0].outcome,'cancelled');
});
test('acceptance 6: multiple offline wearable alerts transfer exactly once', () => {
  const a = setup(); a.ble.disconnect();
  const ids = Array.from({length:5},() => a.demo.pressButton().id);
  assert.equal(new Set(ids).size,5); a.advance(2000); assert.equal(a.alerts.visible().length,0);
  a.ble.connect(); a.advance(5000);
  assert.equal(a.alerts.visible().length,5);
  for (const id of ids) a.alerts.detect('manual',{id});
  assert.equal(a.store.state.events.length,5);
});
test('acceptance 7: reload preserves events, partial audio, and unconfirmed haptic commands', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(21500);
  a.alerts.acknowledge(e.id,'jordan'); a.tick(); assert.equal(e.haptic.status,'sent');
  const b = setup({ storage:a.storage, now:a.now(), clear:false }), restored = b.alerts.get(e.id);
  assert.equal(restored.haptic.status,'pending'); assert.equal(restored.audio.status,'paused');
  assert.deepEqual(restored.audio.receivedChunks,e.audio.receivedChunks);
  b.advance(500); assert.equal(restored.haptic.status,'sent');
  assert.equal(restored.haptic.confirmedAt,null); b.demo.confirmHaptic(e.id,true);
  b.advance(5000); assert.equal(restored.audio.status,'ready');
  assert.equal(b.store.state.events.length,1);
});
test('acceptance 8: connected low battery warns at 20%, recovers above 20%', () => {
  const a = setup(); a.demo.setBattery(20); assert.equal(a.device.readiness().heading,'Time to recharge.');
  a.demo.setBattery(21); assert.equal(a.device.readiness().heading,'Ready when you need it.');
  a.demo.setBattery(14); a.device.updateTelemetry({charging:true});
  assert.equal(a.device.readiness().heading,'Time to recharge.');
});
test('phone actions never create events on a disconnected wearable; telemetry is last known', () => {
  const a = setup(); a.ble.disconnect();
  assert.equal(a.alerts.requestFromPhone(),null); a.demo.setBattery(14); a.demo.setContact(false); a.advance(2000);
  assert.equal(a.device.getStatus().battery,84); assert.equal(a.device.getStatus().worn,true);
  assert.equal(a.device.readiness().heading,'Let’s get you reconnected.');
  assert.equal(a.alerts.visible().length,0); assert.equal(a.alerts.queued().length,1);
});
test('event detection, receipt, delivery, reply, and haptic completion have separate timestamps', () => {
  const a = setup(), e = a.demo.pressButton();
  assert.equal(a.alerts.status(e),'detected'); a.advance(250); assert.equal(a.alerts.status(e),'transferring');
  a.advance(750); assert.equal(a.alerts.status(e),'received');
  assert.equal(a.alerts.acknowledge(e.id,'jordan'),false); a.advance(1000);
  assert.equal(a.alerts.status(e),'delivered'); assert.equal(e.acknowledgedAt,null);
  a.advance(250);
  assert.equal(a.alerts.acknowledge(e.id,'taylor'),true); a.tick(); assert.equal(e.haptic.confirmedAt,null);
  a.advance(250); a.demo.confirmHaptic(e.id,true);
  assert.ok(e.detectedAt < e.receivedAt && e.receivedAt < e.deliveredAt && e.deliveredAt < e.acknowledgedAt && e.acknowledgedAt < e.haptic.confirmedAt);
});
test('delivery failure remains distinct from phone receipt and supports retry', () => {
  const a = setup(); a.store.state.simulation.deliveryFailure = true;
  const e = a.alerts.requestFromPhone(); a.advance(1000);
  assert.equal(e.delivery.status,'failed'); assert.notEqual(e.receivedAt,null); assert.equal(e.deliveredAt,null);
  assert.equal(a.alerts.acknowledge(e.id,'jordan'),false);
  a.store.state.simulation.deliveryFailure = false; a.alerts.retryDelivery(e.id); a.advance(1000);
  assert.equal(e.delivery.status,'delivered'); assert.equal(e.delivery.attempts,2);
});
test('haptic timeout, explicit failure, disconnect, and retry never imply success', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(1000); a.alerts.acknowledge(e.id,'jordan'); a.tick();
  a.advance(5000); assert.equal(e.haptic.status,'failed'); assert.equal(e.haptic.confirmedAt,null);
  a.haptics.retry(e.id); a.tick(); a.ble.disconnect(); assert.equal(e.haptic.status,'pending');
  assert.equal(a.demo.confirmHaptic(e.id,true),false); a.ble.connect(); a.advance(2000);
  a.demo.confirmHaptic(e.id,false); assert.equal(e.haptic.status,'failed');
  a.haptics.retry(e.id); a.tick(); a.demo.confirmHaptic(e.id,true); assert.equal(e.haptic.status,'successful');
});
test('a malformed haptic response cannot mark a command completed', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(1000); a.alerts.acknowledge(e.id,'jordan'); a.tick();
  a.ble.emit('haptic-result',{eventId:e.id,commandId:e.haptic.commandId});
  assert.equal(e.haptic.status,'sent'); assert.equal(e.haptic.confirmedAt,null);
  a.ble.emit('haptic-result',{eventId:e.id,commandId:e.haptic.commandId,success:true});
  assert.equal(e.haptic.status,'successful');
});
test('repeated falls keep their deadline; an expired interrupted session creates one event', () => {
  const a = setup(), fall = a.demo.startFall(), deadline = fall.dueAt;
  a.advance(2000); a.demo.startFall(); assert.equal(fall.dueAt,deadline); assert.equal(fall.repeats,1);
  a.demo.interruptSession();
  const b = setup({storage:a.storage,now:deadline + 1000,clear:false});
  b.tick(); b.tick(); assert.equal(b.store.state.events.length,1);
  assert.equal(b.store.state.events[0].id,fall.id + ':alert'); assert.equal(b.store.state.events[0].detectedAt,deadline);
  assert.equal(b.store.state.fall,null); assert.equal(b.store.state.fallHistory[0].outcome,'timed-out');
});
test('phone cannot cancel offline falls; physical cancellation still works', () => {
  const a = setup(); a.demo.startFall(); a.ble.disconnect();
  assert.equal(a.demo.cancelFall(),false); assert.equal(a.demo.cancelFall({fromPhone:false}),true);
  a.advance(15000); assert.equal(a.store.state.events.length,0);
});
test('offline physical fall cancellation does not pretend that the phone received an update', () => {
  const a = setup(); a.demo.startFall(); a.ble.disconnect();
  a.demo.cancelFall({fromPhone:false});
  assert.equal(a.device.readiness().heading,'Are you okay?');
  a.ble.connect(); a.advance(2000);
  assert.equal(a.device.visibleFall(),null); assert.equal(a.store.state.events.length,0);
});
test('individual component checks fail independently while connected; disconnected checks are unknown', () => {
  for (const name of ['motion','contact','audio','haptic']) {
    const a = setup(); a.demo.setComponent(name,'failed');
    const checks = a.device.check(); assert.equal(checks.find(c => c.id === name).status,'failed');
    assert.equal(checks.find(c => c.id === 'bluetooth').status,'passed');
    assert.equal(a.device.readiness().status,'warning');
    a.ble.disconnect(); assert.ok(a.device.check().filter(c => c.id !== 'bluetooth').every(c => c.status === 'unknown'));
  }
});
test('reordering/deleting contacts does not rewrite delivered recipients or the selected responder', () => {
  const a = setup(), e = a.alerts.requestFromPhone(); a.advance(1000);
  a.store.state.contacts.reverse(); a.store.state.contacts = a.store.state.contacts.filter(c => c.id !== 'taylor');
  assert.equal(a.alerts.acknowledge(e.id,'taylor'),true); assert.equal(e.responder.name,'Taylor Brooks');
  assert.equal(e.recipients.length,2);
});
test('v1 migration preserves contacts/events, deduplicates IDs, and distrusts old automatic haptic success', () => {
  const storage = memory();
  const e = {id:'legacy',type:'manual',created:1000,received:2000,acknowledged:3000,ackBy:'Old contact',status:'acknowledged',audioSynced:true,hapticPending:false};
  storage.setItem('ccew-companion-ui-v1',JSON.stringify({version:1,connected:false,worn:true,battery:14,contacts:[{id:'old',name:'Old contact'}],events:[e],deviceOutbox:[e],profile:{name:'Preserved name'}}));
  const a = setup({storage,clear:false}); assert.equal(a.store.state.events.length,1);
  assert.equal(a.store.state.profile.name,'Preserved name'); assert.equal(a.alerts.get('legacy').haptic.status,'pending');
  assert.equal(a.alerts.get('legacy').responder.name,'Old contact'); assert.equal(a.device.getStatus().battery,14);
});
