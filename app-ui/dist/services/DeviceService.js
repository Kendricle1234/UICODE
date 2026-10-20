(() => {
  'use strict';
  const ns = globalThis.CCEW;
  class DeviceService {
    constructor(store, ble) { this.store = store; this.ble = ble; }
    getStatus() {
      const d = this.store.state.device;
      return { ...ns.clone(this.ble.isReady() ? d.telemetry : d.lastKnown),
        connection: d.connection, current: this.ble.isReady(), lastSync: d.lastSync };
    }
    updateTelemetry(patch) {
      const d = this.store.state.device;
      d.telemetry = { ...d.telemetry, ...patch, components: { ...d.telemetry.components, ...patch.components } };
      if (this.ble.isReady()) { d.lastKnown = ns.clone(d.telemetry); d.lastSync = this.store.now(); }
      this.store.save();
      this.ble.emit('telemetry', this.getStatus());
    }
    visibleFall() {
      if (this.ble.isReady()) return this.store.state.fall;
      const known = this.store.state.device.lastKnownFall;
      return known && known.dueAt > this.store.now() ? known : null;
    }
    readiness({ transferring = false } = {}) {
      const d = this.getStatus();
      const result = (status, badge, heading, description) => ({ status, badge, heading, description });
      if (this.visibleFall()) return result('urgent','FALL CHECK-IN','Are you okay?',
        d.current ? 'A possible fall was detected. Use “I’m okay” to cancel this check-in.' : 'The last received fall check-in is still active. Reconnect to send your cancellation to the wearable.');
      if (d.connection === 'connecting') return result('connecting','CONNECTING','Connecting your wearable.', 'Establishing the simulated Bluetooth link. Sensor readings remain last known.');
      if (d.connection === 'syncing') return result('syncing','SYNCING','Getting back in sync.', 'Restoring the connection and refreshing device readings.');
      if (!d.current) return result('disconnected','CONNECTION LOST','Let’s get you reconnected.', 'Device readings are last known. Events on the wearable will transfer after reconnection.');
      if (d.components.contact !== 'ok' || !d.worn) return result('warning','SKIN CONTACT LOST','Check your wearable.', d.components.contact !== 'ok' ? 'The simulated skin-contact sensor is unavailable. Run a device check.' : 'Skin contact is not detected. Adjust the strap against your wrist.');
      if (d.contactCandidateAt !== null) return result('warning','CHECKING CONTACT','Checking your wearable.', 'Waiting for a stable skin-contact reading before creating a removal alert.');
      if (d.battery <= 20) return result('warning','LOW BATTERY','Time to recharge.', `The simulated battery is at ${d.battery}%. ${d.charging ? 'Keep USB-C connected while it charges.' : 'Connect a USB-C charger.'}`);
      if (Object.values(d.components).some(value => value !== 'ok')) return result('warning','DEVICE CHECK NEEDED','Check your wearable.', 'A simulated component has failed. Open My device for individual results.');
      if (transferring) return result('syncing','SYNCING EVENTS','Getting back in sync.', 'Queued wearable events are transferring to the phone.');
      return result('normal','WEARABLE CONNECTED','Ready when you need it.', 'Your simulated connection, battery, skin contact, and component checks pass.');
    }
    check() {
      const d = this.getStatus();
      const check = (id, label, ok, detail) => ({ id, label, status: !d.current && id !== 'bluetooth' ? 'unknown' : ok ? 'passed' : 'failed', detail: !d.current && id !== 'bluetooth' ? 'Unknown until reconnection' : detail });
      return [
        check('bluetooth','Bluetooth',d.current,d.current ? 'Connected' : d.connection),
        check('battery','Battery',d.battery > 20,`${d.battery}% simulated charge`),
        check('contact','Skin contact',d.components.contact === 'ok' && d.worn && d.contactCandidateAt === null,d.components.contact !== 'ok' ? 'Sensor unavailable' : d.contactCandidateAt !== null ? 'Checking stability' : d.worn ? 'Contact detected' : 'Contact lost'),
        check('motion','Motion sensor',d.components.motion === 'ok',d.components.motion === 'ok' ? 'Simulated sensor responds' : 'Simulated sensor failed'),
        check('audio','Audio sensor',d.components.audio === 'ok',d.components.audio === 'ok' ? 'Synthetic buffer available' : 'Simulated sensor failed'),
        check('haptic','Haptic component',d.components.haptic === 'ok',d.components.haptic === 'ok' ? 'Component available; command completion needs confirmation' : 'Simulated motor failed')
      ];
    }
  }
  ns.DeviceService = DeviceService;
})();
