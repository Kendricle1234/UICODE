/* Physical events and sensor changes belong to the simulator, not phone actions. */
(() => {
  'use strict';
  class DemoWearable {
    constructor(store, ble, device, alerts, haptics) {
      this.store = store; this.ble = ble; this.device = device; this.alerts = alerts; this.haptics = haptics;
    }
    pressButton() { return this.alerts.detect('manual'); }
    setBattery(value) {
      if (!Number.isFinite(value) || value < 0 || value > 100) return false;
      this.device.updateTelemetry({ battery: value }); return true;
    }
    setComponent(name, status) {
      if (!['motion','contact','audio','haptic'].includes(name) || !['ok','failed'].includes(status)) return false;
      this.device.updateTelemetry({ components: { [name]: status } }); return true;
    }
    setContact(worn) {
      const t = this.store.state.device.telemetry;
      if (t.rawWorn === worn) return;
      this.device.updateTelemetry({ rawWorn: worn, contactCandidateAt: worn === t.worn ? null : this.store.now(), briefRestoreAt: null });
    }
    briefContactLoss() {
      if (!this.store.state.device.telemetry.worn) return false;
      this.setContact(false); this.device.updateTelemetry({ briefRestoreAt: this.store.now() + 400 }); return true;
    }
    startFall() {
      if (this.store.state.device.telemetry.components.motion !== 'ok') return null;
      if (this.store.state.fall && this.store.state.fall.dueAt <= this.store.now()) this.tick();
      if (this.store.state.fall) {
        this.store.state.fall.repeats++; this.store.save(); return this.store.state.fall;
      }
      const fall = { id: this.store.id('fall'), startedAt: this.store.now(), dueAt: this.store.now() + 10000,
        repeats: 0, phoneVisible: this.ble.isReady(), interrupted: false };
      this.store.state.fall = fall; this.store.save(); return fall;
    }
    cancelFall({ fromPhone = true } = {}) {
      if (!this.store.state.fall || (fromPhone && !this.ble.isReady())) return false;
      if (this.store.state.fall.dueAt <= this.store.now()) { this.tick(); return false; }
      this.store.state.fallHistory.unshift({ ...this.store.state.fall, outcome: 'cancelled', endedAt: this.store.now() });
      this.store.state.fall = null; this.store.save(); return true;
    }
    interruptSession() {
      if (this.store.state.fall) this.store.state.fall.interrupted = true;
      this.store.save();
    }
    confirmHaptic(id, success) {
      const event = this.alerts.get(id);
      return event ? this.haptics.confirm(id, event.haptic.commandId, success) : false;
    }
    tick() {
      const now = this.store.now(), t = this.store.state.device.telemetry;
      if (t.briefRestoreAt !== null && t.briefRestoreAt <= now) this.setContact(true);
      else if (t.contactCandidateAt !== null && now - t.contactCandidateAt >= 1500 && t.components.contact === 'ok') {
        const worn = t.rawWorn;
        this.device.updateTelemetry({ worn, contactCandidateAt: null });
        if (!worn) this.alerts.detect('removal');
      }
      const fall = this.store.state.fall;
      if (fall && fall.dueAt <= now) {
        this.alerts.detect('fall', { id: `${fall.id}:alert`, detectedAt: fall.dueAt });
        this.store.state.fallHistory.unshift({ ...fall, outcome: 'timed-out', endedAt: fall.dueAt });
        this.store.state.fall = null; this.store.save();
      } else if (fall && !fall.phoneVisible && this.ble.isReady()) {
        fall.phoneVisible = true; this.store.save();
      }
    }
  }
  globalThis.CCEW.DemoWearable = DemoWearable;
})();
