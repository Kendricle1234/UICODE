(() => {
  'use strict';
  const ns = globalThis.CCEW;
  class AlertService {
    constructor(store, ble) {
      this.store = store; this.ble = ble;
      ble.on('disconnect', () => this.pause());
      ble.on('event', packet => this.detect(packet.type, { id: packet.id, detectedAt: packet.detectedAt }));
    }
    get(id) { return this.store.state.events.find(e => e.id === id); }
    visible() { return this.store.state.events.filter(e => e.receivedAt !== null).sort((a,b) => b.detectedAt - a.detectedAt); }
    queued() { return this.store.state.events.filter(e => e.receivedAt === null); }
    detect(type = 'manual', { id, source = 'wearable', detectedAt = this.store.now() } = {}) {
      if (!['manual','fall','removal','test'].includes(type) || !['phone','wearable'].includes(source)) return null;
      if (source === 'phone' && !this.ble.isReady()) return null;
      if (id && this.get(id)) return this.get(id);
      const event = { id: id || this.store.id('event'), type, source, detectedAt,
        receivedAt: source === 'phone' ? this.store.now() : null, deliveredAt: null, acknowledgedAt: null,
        responder: null, recipients: [],
        transfer: { status: source === 'phone' ? 'received' : 'queued', dueAt: null, attempts: 0 },
        delivery: { status: 'not-sent', dueAt: null, attempts: 0, reason: '' },
        haptic: ns.blankHaptic(), audio: ns.audioState(detectedAt) };
      if (this.store.state.device.telemetry.components.audio !== 'ok') event.audio.status = 'unavailable';
      this.store.state.events.unshift(event);
      if (source === 'phone') this.startDelivery(event);
      this.store.save(); return event;
    }
    requestFromPhone() { return this.detect('manual', { source: 'phone' }); }
    startDelivery(event) {
      event.recipients = ns.clone(this.store.state.contacts);
      Object.assign(event.delivery, { status: 'pending', dueAt: this.store.now() + 800, reason: '', attempts: event.delivery.attempts + 1 });
    }
    retryDelivery(id) {
      const event = this.get(id);
      if (!event || event.receivedAt === null || event.delivery.status !== 'failed') return false;
      this.startDelivery(event); this.store.save(); return true;
    }
    acknowledge(id, contactId) {
      const event = this.get(id);
      const contact = event?.recipients.find(c => c.id === contactId);
      if (!event || !contact || event.delivery.status !== 'delivered' || event.acknowledgedAt !== null) return false;
      event.acknowledgedAt = this.store.now(); event.responder = ns.clone(contact);
      event.haptic = { ...ns.blankHaptic(), status: 'pending', commandId: `${event.id}:haptic`, requestedAt: this.store.now() };
      this.store.save(); return true;
    }
    pause() {
      for (const event of this.queued()) if (event.transfer.status === 'transferring') {
        event.transfer.status = 'queued'; event.transfer.dueAt = null;
      }
      this.store.save();
    }
    tick() {
      const now = this.store.now(); let changed = false;
      for (const event of this.store.state.events) {
        if (event.receivedAt === null && this.ble.isReady()) {
          if (event.transfer.status === 'queued') {
            Object.assign(event.transfer, { status: 'transferring', dueAt: now + 600, attempts: event.transfer.attempts + 1 }); changed = true;
          } else if (event.transfer.dueAt <= now) {
            event.receivedAt = now; event.transfer.status = 'received'; event.transfer.dueAt = null;
            this.startDelivery(event); changed = true;
          }
        }
        // Contact delivery is a phone-side simulation and can finish with BLE disconnected.
        if (event.delivery.status === 'pending' && event.delivery.dueAt <= now) {
          const failed = this.store.state.simulation.deliveryFailure || !event.recipients.length;
          event.delivery.status = failed ? 'failed' : 'delivered'; event.delivery.dueAt = null;
          event.delivery.reason = failed ? event.recipients.length ? 'Simulated delivery failure.' : 'No safety contacts configured.' : '';
          if (!failed) event.deliveredAt = now;
          changed = true;
        }
      }
      if (changed) this.store.save();
    }
    status(event) {
      if (event.acknowledgedAt !== null) return 'acknowledged';
      if (event.deliveredAt !== null) return 'delivered';
      if (event.delivery.status === 'failed') return 'delivery-failed';
      if (event.receivedAt !== null) return 'received';
      return event.transfer.status === 'transferring' ? 'transferring' : 'detected';
    }
  }
  ns.AlertService = AlertService;
})();
