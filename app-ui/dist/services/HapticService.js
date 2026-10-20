(() => {
  'use strict';
  class HapticService {
    constructor(store, ble, alerts) {
      this.store = store; this.ble = ble; this.alerts = alerts;
      ble.on('disconnect', () => {
        for (const event of store.state.events) if (event.haptic.status === 'sent') {
          event.haptic.status = 'pending'; event.haptic.deadline = null;
          event.haptic.reason = 'Connection interrupted; completion is unconfirmed.';
        }
        store.save();
      });
      ble.on('haptic-result', result => this.confirm(result.eventId, result.commandId, result.success));
    }
    retry(id) {
      const event = this.alerts.get(id);
      if (!event || event.haptic.status !== 'failed') return false;
      event.haptic.status = 'pending'; event.haptic.deadline = null; event.haptic.reason = '';
      this.store.save(); return true;
    }
    confirm(id, commandId, success) {
      if (typeof success !== 'boolean') return false;
      const event = this.alerts.get(id);
      if (!this.ble.isReady() || event?.haptic.status !== 'sent' || event.haptic.commandId !== commandId) return false;
      const h = event.haptic;
      if (h.deadline <= this.store.now()) {
        h.status = 'failed'; h.deadline = null; h.reason = 'Timed out waiting for wearable confirmation.';
        this.store.save(); return false;
      }
      h.status = success ? 'successful' : 'failed'; h.deadline = null;
      h.confirmedAt = success ? this.store.now() : null;
      h.reason = success ? '' : 'The simulated wearable reported a motor failure.';
      this.store.save(); return true;
    }
    tick() {
      let changed = false;
      for (const event of this.store.state.events) {
        const h = event.haptic;
        if (h.status === 'pending' && this.ble.isReady()) {
          if (this.store.state.device.telemetry.components.haptic !== 'ok') {
            h.status = 'failed'; h.reason = 'Simulated haptic component unavailable.';
          } else if (this.ble.send({ type: 'haptic', eventId: event.id, commandId: h.commandId, pattern: this.store.state.settings.hapticPattern })) {
            h.status = 'sent'; h.sentAt = this.store.now(); h.attempts++; h.deadline = this.store.now() + 5000; h.reason = '';
          }
          changed = true;
        } else if (h.status === 'sent' && h.deadline <= this.store.now()) {
          h.status = 'failed'; h.deadline = null; h.reason = 'Timed out waiting for wearable confirmation.'; changed = true;
        }
      }
      if (changed) this.store.save();
    }
  }
  globalThis.CCEW.HapticService = HapticService;
})();
