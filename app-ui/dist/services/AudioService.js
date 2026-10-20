(() => {
  'use strict';
  class AudioService {
    constructor(store, ble) {
      this.store = store; this.ble = ble; this.player = null; this.sampleURL = null; this.onPlayback = () => {};
      ble.on('disconnect', () => {
        for (const event of store.state.events) if (event.audio.status === 'transferring') {
          event.audio.status = 'paused'; event.audio.nextChunkAt = null;
        }
        store.save();
      });
    }
    tick() {
      const now = this.store.now(); let changed = false;
      for (const event of this.store.state.events) {
        const audio = event.audio;
        if (['ready','unavailable'].includes(audio.status)) continue;
        if (audio.status === 'capturing' && this.store.state.device.telemetry.components.audio !== 'ok') {
          audio.status = 'unavailable'; changed = true; continue;
        }
        if (now < audio.captureReadyAt) continue;
        if (!this.ble.isReady() || event.receivedAt === null) {
          const status = audio.receivedChunks.length ? 'paused' : 'queued';
          if (audio.status !== status) { audio.status = status; audio.nextChunkAt = null; changed = true; }
          continue;
        }
        if (audio.status !== 'transferring') {
          audio.status = 'transferring'; audio.nextChunkAt = now + 400; changed = true;
        } else if (audio.nextChunkAt <= now) {
          // Stable chunk indices make reconnect retries idempotent.
          const next = Array.from({ length: audio.totalChunks }, (_,i) => i).find(i => !audio.receivedChunks.includes(i));
          if (next !== undefined) audio.receivedChunks.push(next);
          audio.nextChunkAt = now + 400;
          if (audio.receivedChunks.length === audio.totalChunks) {
            audio.status = 'ready'; audio.completedAt = now; audio.nextChunkAt = null;
          }
          changed = true;
        }
      }
      if (changed) this.store.save();
    }
    description(event) {
      const a = event.audio;
      if (a.status === 'capturing') return `Capturing · ${Math.max(0,Math.ceil((a.captureReadyAt - this.store.now()) / 1000))}s remaining`;
      if (a.status === 'ready') return 'Ready · 40s synthetic sample';
      if (a.status === 'unavailable') return 'Audio unavailable · simulated sensor failure';
      return `${a.status === 'paused' ? 'Paused' : a.status === 'queued' ? 'Queued' : 'Transferring'} · ${a.receivedChunks.length}/${a.totalChunks} chunks`;
    }
    makeSampleURL() {
      if (this.sampleURL) return this.sampleURL;
      const rate = 16000, count = rate * 40, buffer = new ArrayBuffer(44 + count * 2), dv = new DataView(buffer);
      const text = (offset, value) => [...value].forEach((c,i) => dv.setUint8(offset + i, c.charCodeAt(0)));
      text(0,'RIFF'); dv.setUint32(4,36 + count * 2,true); text(8,'WAVE'); text(12,'fmt ');
      dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true);
      dv.setUint32(24,rate,true); dv.setUint32(28,rate * 2,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true);
      text(36,'data'); dv.setUint32(40,count * 2,true);
      for (let i = 0; i < count; i++) {
        const t = i / rate, p = t % 4;
        const value = p < .22 ? Math.sin(2 * Math.PI * (t < 20 ? 330 : 440) * t) * .07 * Math.sin(Math.PI * p / .22) : 0;
        dv.setInt16(44 + i * 2,Math.round(value * 32767),true);
      }
      this.sampleURL = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
      return this.sampleURL;
    }
    async play(event) {
      if (event.audio.status !== 'ready') return false;
      if (!this.player) {
        this.player = new Audio(this.makeSampleURL());
        for (const name of ['timeupdate','play','pause','ended']) this.player.addEventListener(name, () => this.onPlayback());
      }
      if (!this.player.paused) this.player.pause();
      else await this.player.play();
      return true;
    }
    stop() { if (this.player) { this.player.pause(); this.player = null; } }
    dispose() { this.stop(); if (this.sampleURL) URL.revokeObjectURL(this.sampleURL); this.sampleURL = null; }
  }
  globalThis.CCEW.AudioService = AudioService;
})();
