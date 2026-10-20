/* Persisted simulation state. No hardware or network access. */
(() => {
  'use strict';
  const ns = globalThis.CCEW ||= {};
  const STORAGE_KEY = 'ccew-companion-ui-v1'; // Retain the key to migrate earlier prototypes.
  const clone = value => JSON.parse(JSON.stringify(value));
  const blankHaptic = () => ({ status: 'not-requested', commandId: null, requestedAt: null, sentAt: null, confirmedAt: null, deadline: null, attempts: 0, reason: '' });
  const audioState = (now, ready = false) => ({
    status: ready ? 'ready' : 'capturing', captureReadyAt: now + 20000,
    preSeconds: 20, postSeconds: 20, durationSeconds: 40, totalChunks: 8,
    receivedChunks: ready ? [0,1,2,3,4,5,6,7] : [], nextChunkAt: null,
    completedAt: ready ? now + 24000 : null
  });
  function freshState(now) {
    const telemetry = { battery: 84, charging: false, worn: true, rawWorn: true,
      contactCandidateAt: null, briefRestoreAt: null,
      components: { motion: 'ok', contact: 'ok', audio: 'ok', haptic: 'ok' } };
    const contacts = [
      { id: 'jordan', name: 'Jordan Lee', role: 'Team supervisor', phone: '(555) 010-0248', email: 'jordan@example.com' },
      { id: 'taylor', name: 'Taylor Brooks', role: 'Safety representative', phone: '(555) 010-0163', email: 'taylor@example.com' }
    ];
    const events = [0,1].map(index => {
      const detectedAt = now - (index ? 86400000 : 3600000);
      return { id: `sample-${index ? 'fall' : 'check'}`, type: index ? 'fall' : 'test', source: 'wearable',
        detectedAt, receivedAt: detectedAt + 1000, deliveredAt: detectedAt + 2000,
        acknowledgedAt: detectedAt + 60000, responder: clone(contacts[index]),
        recipients: clone(contacts), transfer: { status: 'received', dueAt: null, attempts: 1 },
        delivery: { status: 'delivered', dueAt: null, attempts: 1, reason: '' },
        haptic: { ...blankHaptic(), status: 'successful', commandId: `sample-haptic-${index}`,
          requestedAt: detectedAt + 60000, sentAt: detectedAt + 61000, confirmedAt: detectedAt + 62000, attempts: 1 },
        audio: audioState(detectedAt, true) };
    });
    return { version: 2, sequence: 0,
      profile: { name: 'Alex Morgan', role: 'Community responder', organization: 'Community response team' },
      settings: { disconnectNotice: true, contactNotice: true, reducedMotion: false, hapticPattern: 'Two short pulses' },
      contacts, events, device: { connection: 'connected', transitionDue: null, lastSync: now, lastKnownFall: null,
        telemetry, lastKnown: clone(telemetry) },
      simulation: { deliveryFailure: false }, fall: null, fallHistory: [] };
  }
  function migrate(saved, now) {
    const base = freshState(now);
    if (!saved || ![1,2].includes(saved.version) || !Array.isArray(saved.contacts) || !Array.isArray(saved.events)) return base;
    base.contacts = saved.contacts.filter(c => c && typeof c.id === 'string' && typeof c.name === 'string');
    base.profile = { ...base.profile, ...saved.profile };
    base.settings = { ...base.settings, ...saved.settings };
    if (saved.version === 2) {
      base.sequence = Number(saved.sequence) || 0;
      base.device = { ...base.device, ...saved.device,
        telemetry: { ...base.device.telemetry, ...saved.device?.telemetry,
          components: { ...base.device.telemetry.components, ...saved.device?.telemetry?.components } },
        lastKnown: { ...base.device.lastKnown, ...saved.device?.lastKnown,
          components: { ...base.device.lastKnown.components, ...saved.device?.lastKnown?.components } } };
      if (!['connected','connecting','syncing','disconnected'].includes(base.device.connection)) base.device.connection = 'disconnected';
      // A new browser session cannot assume an in-flight transport command completed.
      if (['connecting','syncing'].includes(base.device.connection)) { base.device.connection = 'disconnected'; base.device.transitionDue = null; }
      base.simulation = { ...base.simulation, ...saved.simulation };
      base.fall = saved.fall ? { ...saved.fall, interrupted: true } : null;
      base.fallHistory = Array.isArray(saved.fallHistory) ? saved.fallHistory : [];
      base.events = saved.events.filter(e => e && typeof e.id === 'string' && e.transfer && e.delivery && e.audio && e.haptic).map(clone);
      for (const event of base.events) {
        if (event.transfer.status === 'transferring') { event.transfer.status = 'queued'; event.transfer.dueAt = null; }
        if (event.audio.status === 'transferring') { event.audio.status = 'paused'; event.audio.nextChunkAt = null; }
        if (event.haptic.status === 'sent') { event.haptic.status = 'pending'; event.haptic.deadline = null; }
        event.audio.receivedChunks = [...new Set(event.audio.receivedChunks)].filter(n => Number.isInteger(n) && n >= 0 && n < event.audio.totalChunks);
      }
    } else {
      const telemetry = base.device.telemetry;
      for (const key of ['battery','worn','charging']) if (saved[key] !== undefined) telemetry[key] = saved[key];
      telemetry.rawWorn = telemetry.worn;
      base.device.lastKnown = clone(telemetry);
      base.device.connection = saved.connected ? 'connected' : 'disconnected';
      base.device.lastSync = saved.lastSync || now;
      base.fall = saved.fallDue ? { id: 'legacy-fall', startedAt: saved.fallDue - 10000,
        dueAt: saved.fallDue, repeats: 0, phoneVisible: !!saved.connected, interrupted: true } : null;
      base.events = [...saved.events, ...(saved.deviceOutbox || [])].filter(e => e && typeof e.id === 'string').map(e => {
        const receivedAt = e.received || (saved.events.includes(e) ? e.created : null);
        const acknowledgedAt = e.acknowledged || null;
        return { id: e.id, type: e.type, source: 'wearable', detectedAt: e.created,
          receivedAt, deliveredAt: acknowledgedAt ? receivedAt : null, acknowledgedAt,
          responder: acknowledgedAt ? { id: 'legacy-contact', name: e.ackBy || 'Demo contact' } : null,
          recipients: clone(base.contacts),
          transfer: { status: receivedAt ? 'received' : 'queued', dueAt: null, attempts: 0 },
          delivery: { status: acknowledgedAt ? 'delivered' : receivedAt ? 'pending' : 'not-sent', dueAt: receivedAt && !acknowledgedAt ? now + 800 : null, attempts: 0, reason: '' },
          // Legacy replies did not prove that the motor completed a command.
          haptic: { ...blankHaptic(), ...(acknowledgedAt ? { status: 'pending', commandId: `${e.id}:haptic`, requestedAt: acknowledgedAt, reason: 'Awaiting explicit wearable confirmation after upgrade.' } : {}) },
          audio: { ...audioState(e.created, !!e.audioSynced), captureReadyAt: e.audioReadyAt || e.created + 20000 } };
      });
    }
    base.events = [...new Map(base.events.map(e => [e.id, e])).values()];
    return base;
  }
  class Store {
    constructor({ storage, now = () => Date.now() } = {}) {
      this.storage = storage; this.now = now; this.revision = 0; this.storageFailed = false;
      let saved;
      try { saved = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null'); } catch { this.storageFailed = true; }
      this.state = migrate(saved, this.now());
      this.save();
    }
    save() {
      this.revision++;
      try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { this.storageFailed = true; }
    }
    id(prefix) { this.state.sequence++; return `${prefix}-${this.now().toString(36)}-${this.state.sequence}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`; }
    reset() { this.state = freshState(this.now()); this.save(); }
  }
  Object.assign(ns, { Store, blankHaptic, audioState, clone });
})();
