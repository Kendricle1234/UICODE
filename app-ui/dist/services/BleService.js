/* Mock transport contract. Replace this adapter when the BLE protocol is defined. */
(() => {
  'use strict';
  class BleService {
    constructor(store, { protocol = {} } = {}) { this.store = store; this.protocol = protocol; this.listeners = new Map(); }
    on(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(listener);
      return () => this.listeners.get(type)?.delete(listener);
    }
    emit(type, payload) { this.listeners.get(type)?.forEach(listener => listener(payload)); }
    isReady() { return this.store.state.device.connection === 'connected'; }
    connect() {
      const device = this.store.state.device;
      if (device.connection !== 'disconnected') return false;
      device.connection = 'connecting'; device.transitionDue = this.store.now() + 750;
      this.store.save(); this.emit('connection', 'connecting'); return true;
    }
    disconnect() {
      const device = this.store.state.device;
      if (this.isReady()) device.lastKnownFall = globalThis.CCEW.clone(this.store.state.fall);
      device.connection = 'disconnected'; device.transitionDue = null;
      this.store.save(); this.emit('disconnect'); this.emit('connection', 'disconnected');
    }
    tick() {
      const device = this.store.state.device;
      if (device.transitionDue === null || this.store.now() < device.transitionDue) return;
      if (device.connection === 'connecting') {
        device.connection = 'syncing'; device.transitionDue = this.store.now() + 750;
      } else if (device.connection === 'syncing') {
        device.connection = 'connected'; device.transitionDue = null;
        device.lastSync = this.store.now(); device.lastKnown = globalThis.CCEW.clone(device.telemetry);
        device.lastKnownFall = globalThis.CCEW.clone(this.store.state.fall);
        this.emit('connect');
      }
      this.store.save(); this.emit('connection', device.connection);
    }
    send(command) {
      if (!this.isReady()) return false;
      this.emit('command', command);
      return true; // Transport acceptance is not a device completion acknowledgement.
    }
    receive(packet) { if (this.isReady()) this.emit('event', packet); }
  }
  globalThis.CCEW.BleService = BleService;
})();
