/* CCEW Companion: browser-local UI prototype. No network, BLE, microphone,
   contact messages, or emergency services are accessed by this application. */
'use strict';

const ICONS = {
 shield:'<path d="M12 3 20 6v6c0 5-4 8-8 10-4-2-8-5-8-10V6z"/><path d="m8 12 3 3 5-6"/>',
 home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
 watch:'<rect x="5" y="6" width="14" height="12" rx="4"/><path d="m8 6 1-4h6l1 4M8 18l1 4h6l1-4"/><circle cx="12" cy="12" r="2.5"/>',
 bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4"/><path d="M12 2v2"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v2"/>',
 settings:'<path d="m10 3-1 3-3 1-3-1-1 4 3 2v3l-2 2 3 3 3-1 2 2 3-1 1-3 3-1 2-3-2-3V7l-3-1-2-3z"/><circle cx="12" cy="12" r="3"/>',
 battery:'<rect x="2" y="6" width="18" height="12" rx="2"/><path d="M23 10v4M6 10v4m4-4v4m4-4v4"/>',
 bluetooth:'<path d="m7 6 12 12-7 4V2l7 4L7 18"/>',
 contact:'<path d="M5 15v-3a2 2 0 0 1 4 0V5a2 2 0 0 1 4 0v6-4a2 2 0 0 1 4 0v5-2a2 2 0 0 1 4 0v6c0 4-3 6-7 6-5 0-6-3-9-7Z"/>',
 activity:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 alert:'<path d="M12 3 2 21h20zM12 9v5m0 3v1"/>',
 mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 sync:'<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3"/>',
 sliders:'<path d="M5 3v5m0 4v9M12 3v10m0 4v4M19 3v2m0 4v12M2 8h6m1 9h6m1-12h6"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
 phone:'<path d="m4 3 4-1 3 6-3 2a15 15 0 0 0 6 6l2-3 6 3-1 4c-1 3-7 1-12-4S2 5 4 3z"/>',
 edit:'<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 vibration:'<rect x="8" y="5" width="8" height="14" rx="3"/><path d="m5 6-2 3 2 3-2 3 2 3M19 6l2 3-2 3 2 3-2 3"/>',
 usb:'<path d="M12 21V3m-3 3 3-3 3 3M12 17l-6-5V8m6 6 6-5V5"/><circle cx="6" cy="6" r="2"/><path d="M16 2h4v4h-4z"/>',
 play:'<path d="m8 4 12 8-12 8z"/>',
 pause:'<path d="M8 4v16M16 4v16"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 offline:'<path d="m3 3 18 18M7 6l12 12-7 4V2l7 4L7 18"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
 moon:'<path d="M20 14A8 8 0 0 1 10 4a9 9 0 1 0 10 10Z"/>',
 external:'<path d="M14 3h7v7m-1-6-9 9M10 3H3v18h18v-7"/>'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials = name => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();

// Composition root: views call services instead of changing wearable telemetry.
const { Store, BleService, DeviceService, AlertService, HapticService, AudioService, DemoWearable } = CCEW;
let browserStorage;
try { browserStorage = localStorage; } catch { /* Private/file contexts can deny storage. */ }
const store = new Store({ storage: browserStorage });
const ble = new BleService(store);
const device = new DeviceService(store, ble);
const alerts = new AlertService(store, ble);
const haptics = new HapticService(store, ble, alerts);
const audio = new AudioService(store, ble);
const demo = new DemoWearable(store, ble, device, alerts, haptics);
const app = { store, ble, device, alerts, haptics, audio, demo };
window.CCEWApp = app;
const NAV = [['overview','home','Overview'],['device','watch','My device'],['alerts','bell','Alerts'],['contacts','users','Contacts'],['settings','settings','Settings']];
const TYPES = { manual: { title: 'Manual alert', icon: 'alert' }, fall: { title: 'Fall detected', icon: 'activity' }, removal: { title: 'Device removal detected', icon: 'contact' }, test: { title: 'Device check completed', icon: 'checkcircle' } };
const STATUS = { detected: 'Detected on wearable', transferring: 'Transferring to phone', received: 'Received by phone', delivered: 'Delivered to safety contacts', acknowledged: 'Acknowledged', 'delivery-failed': 'Contact delivery failed' };
const HAPTIC = { 'not-requested': 'Not requested', pending: 'Pending connection', sent: 'Command sent · awaiting confirmation', successful: 'Wearable confirmed completion', failed: 'Feedback failed' };
let view = location.hash.slice(1) || 'overview';
let statusFilter = 'all', typeFilter = 'all', activeEvent = null, toastTimer, needsRender = false, clockLabel = '';
const modal = document.querySelector('#modal');
const time = stamp => new Date(stamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const exactTime = stamp => stamp === null ? 'Pending' : new Date(stamp).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', second:'2-digit', timeZoneName:'short' });
const stamp = value => value === null ? '<span>Pending</span>' : `<time datetime="${new Date(value).toISOString()}">${esc(exactTime(value))}</time>`;
const pendingCount = () => alerts.visible().filter(e => e.acknowledgedAt === null).length;
const greeting = (date = new Date()) => date.getHours() < 12 ? 'Good morning' : date.getHours() < 18 ? 'Good afternoon' : 'Good evening';
function deviceReadiness() { return device.readiness({ transferring: alerts.queued().length > 0 && ble.isReady() }); }
const wave = () => `<div class="waveform" aria-hidden="true">${Array.from({length:44}, (_,i) => `<span style="height:${8 + Math.round(Math.abs(Math.sin(i*2.17)*Math.sin(i*.43))*28)}px"></span>`).join('')}</div>`;
const pill = (text, mode = '') => `<span class="pill ${mode}">${esc(text)}</span>`;
const statusPill = event => pill(STATUS[alerts.status(event)], event.acknowledgedAt !== null ? '' : 'pending');
function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); }); }
function announce(text) { document.querySelector('#live-updates').textContent = text; }
function toast(text, error = false) {
  const node = document.querySelector('#toast'); node.textContent = text;
  node.classList.add('visible'); node.classList.toggle('error',error);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'),4200); announce(text);
}
function navTo(target) {
  view = NAV.some(n => n[0] === target) ? target : 'overview';
  if (location.hash !== '#' + view) history.pushState(null,'','#' + view);
  closeModal(); render(); document.querySelector('#main').focus({preventScroll:true}); window.scrollTo(0,0);
}
window.addEventListener('hashchange', () => navTo(location.hash.slice(1)));
function header(title, subtitle, eyebrow = 'YOUR COMPANION') {
  return `<div class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="header-actions"><span class="demo-pill">DEMO DATA</span><button class="icon-button" data-view="alerts" aria-label="View alerts">${icon('bell')}</button><button class="header-avatar" data-view="settings" aria-label="Edit your profile">${esc(initials(store.state.profile.name))}</button></div></div>`;
}
function notices() {
  const d = device.getStatus(), fall = device.visibleFall(); let html = '';
  if (!d.current) html += `<div class="notice error">${icon('offline')}<span class="notice-copy"><strong>${d.connection === 'disconnected' ? 'Wearable disconnected.' : 'Connection in progress.'}</strong> Device readings are last known. Phone alerts require a connection.</span><button class="button" data-action="reconnect" ${d.connection !== 'disconnected' ? 'disabled' : ''}>Reconnect</button></div>`;
  if (d.current && (!d.worn || d.components.contact !== 'ok')) html += `<div class="notice">${icon('contact')}<span class="notice-copy"><strong>Check your wearable.</strong> Skin contact is ${d.components.contact === 'ok' ? 'not detected' : 'unavailable'}.</span><button class="button" data-view="device">View device</button></div>`;
  if (d.battery <= 20) html += `<div class="notice">${icon('battery')}<span class="notice-copy"><strong>${d.current ? 'Battery is low' : 'Last known battery was low'} (${d.battery}%).</strong> ${d.current ? 'Connect a USB-C charger.' : 'Reconnect to update the reading.'}</span></div>`;
  if (fall) html += `<div class="notice error">${icon('activity')}<span class="notice-copy"><strong>Possible fall check-in.</strong> <span data-fall-count>${Math.max(0,Math.ceil((fall.dueAt-store.now())/1000))}</span>s remaining.${fall.repeats ? ` ${fall.repeats} repeated detection(s); the deadline is unchanged.` : ''}${fall.interrupted ? ' Restored after an interrupted session.' : ''}</span><button class="button" data-action="cancel-fall" ${!d.current ? 'disabled' : ''}>I'm okay</button></div>`;
  return html;
}
function render() {
  if (!NAV.some(n => n[0] === view)) view = 'overview';
  const d = device.getStatus(); document.body.classList.toggle('reduced-motion',store.state.settings.reducedMotion);
  document.title = `${NAV.find(n => n[0] === view)[2]} · CCEW Companion`;
  document.querySelector('#desktop-nav').innerHTML = NAV.map(([id,i,name]) => `<a class="nav-link ${view === id ? 'active' : ''}" ${view === id ? 'aria-current="page"' : ''} href="#${id}">${icon(i)}<span class="nav-label">${name}</span>${id === 'alerts' && pendingCount() ? `<span class="nav-number">${pendingCount()}</span>` : ''}</a>`).join('');
  document.querySelector('#mobile-nav').innerHTML = NAV.map(([id,i,name]) => `<a class="${view === id ? 'active' : ''}" ${view === id ? 'aria-current="page"' : ''} href="#${id}">${icon(i)}<span>${name === 'My device' ? 'Device' : name}</span></a>`).join('');
  document.querySelector('#sidebar-connection').innerHTML = `<span class="small-dot"></span><span><strong>${esc(d.connection[0].toUpperCase() + d.connection.slice(1))}</strong><small>CCEW-024 · ${d.battery}%${!d.current ? ' (last known)' : ' simulated charge'}</small></span>`;
  document.querySelector('#main').innerHTML = ({ overview:overviewPage, device:devicePage, alerts:alertsPage, contacts:contactsPage, settings:settingsPage }[view])();
  needsRender = false; hydrateIcons();
}
function contactSummary() {
  return store.state.contacts.slice(0,2).map((c,i) => `<div class="contact"><div class="avatar ${i ? 'rose' : ''}">${esc(initials(c.name))}</div><div><div class="name">${esc(c.name)}</div><div class="role">${esc(c.role)}</div></div><span class="contact-priority">${i ? 'BACKUP' : 'PRIMARY'}</span></div>`).join('') || '<p class="small-description">Add a safety contact to enable simulated delivery.</p>';
}
function activityRow(event) {
  const type = TYPES[event.type] || TYPES.manual;
  return `<button class="activity-row" data-action="event" data-id="${esc(event.id)}"><span class="row-symbol">${icon(type.icon)}</span><span class="row-main"><span class="row-title">${type.title}</span><span class="row-subtitle">${event.responder ? `Acknowledged by ${esc(event.responder.name)}` : esc(STATUS[alerts.status(event)])}</span></span><span class="row-time">${esc(time(event.detectedAt))}</span></button>`;
}
function overviewPage() {
  const readiness = deviceReadiness(), d = device.getStatus(), first = esc(store.state.profile.name.split(' ')[0] || 'there');
  return header(`${greeting()}, ${first}.`,'A quick check before you head out.',new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})) + notices() + `
    <div class="content-grid"><div class="main-stack">
      <section class="panel hero" aria-label="Wearable readiness"><div class="hero-copy"><span class="status-tag readiness-${readiness.status}"><span class="small-dot"></span>${readiness.badge}</span><h2>${readiness.heading}</h2><p>${readiness.description}</p><button class="text-link" data-view="device">Manage device ${icon('arrow')}</button></div><img class="wearable-illustration" src="./assets/wearable.svg" alt="Concept illustration of the CCEW wrist-worn alert device"><div class="hero-bottom"><span class="hero-device-name">${icon('watch')} CCEW-024 / Wrist wearable</span><span class="hero-sync">${icon('sync')} ${d.current ? 'Simulated readings' : 'Last seen ' + time(d.lastSync)}</span></div></section>
      <div class="metrics">
        <section class="panel metric"><p class="metric-label">Device battery ${icon('battery')}</p><div class="metric-value ${d.battery > 20 ? 'good-text' : ''}">${d.battery}<span class="metric-unit">%</span></div><div class="metric-detail">${!d.current ? 'Last known level' : d.charging ? 'Charging via USB-C' : d.battery <= 20 ? 'Connect a charger' : 'Simulated charge'}</div><div class="battery-track"><span style="width:${d.battery}%"></span></div></section>
        <section class="panel metric"><p class="metric-label">Skin contact ${icon('contact')}</p><div class="metric-value">${!d.current ? 'Unknown' : d.components.contact !== 'ok' ? 'Unavailable' : d.contactCandidateAt !== null ? 'Checking' : d.worn ? 'On wrist' : 'Check fit'}</div><div class="metric-detail">${!d.current ? 'Reconnect to update' : '1.5s stable reading'}</div></section>
        <section class="panel metric"><p class="metric-label">Fall detection ${icon('activity')}</p><div class="metric-value">${!d.current ? 'Last seen' : d.components.motion === 'ok' ? 'Active' : 'Failed'}</div><div class="metric-detail">${!d.current ? 'Current status unknown' : d.components.motion === 'ok' ? 'Simulated motion sensor' : 'Run a device check'}</div></section>
      </div>
      <section class="alert-banner"><div class="alert-icon">${icon('alert')}</div><div class="alert-copy"><h2>Support, a tap away.</h2><p>${d.current ? 'Create a simulated phone alert.' : 'Reconnect to send a phone alert.'}</p></div><button class="button danger" data-action="send-alert" ${!d.current ? 'disabled' : ''}>Send alert ${icon('arrow')}</button></section>
      <section class="panel recent-panel"><div class="panel-header"><h2>Recent activity</h2><button class="text-link" data-view="alerts">View all ${icon('arrow')}</button></div>${alerts.visible().slice(0,3).map(activityRow).join('') || '<p class="small-description">No events received by this phone yet.</p>'}</section>
    </div><aside class="side-stack" aria-label="Audio and safety contacts">
      <section class="panel audio-card"><div class="audio-top"><span class="audio-symbol">${icon('mic')}</span><span class="audio-state">${!d.current ? 'Last known buffer status' : d.components.audio === 'ok' ? 'Synthetic buffer active' : 'Simulated audio unavailable'}</span></div><h2>A little context.<br>When it matters.</h2><p>Audio around an alert can give your safety contacts a clearer picture.</p>${wave()}<div class="wave-labels"><span>20s BEFORE</span><span>ALERT</span><span>20s AFTER</span></div><div class="audio-footer">${icon('lock')} Synthetic samples only · no microphone</div></section>
      <section class="panel contacts-card"><div class="panel-header"><h2>Your safety circle</h2><button class="text-link" data-view="contacts" aria-label="Manage safety contacts">${icon('edit')}</button></div>${contactSummary()}<p class="contacts-note">Contact delivery and human acknowledgement are separate simulated steps.</p></section>
      <section class="small-panel">${icon('checkcircle')}<div><h3>A quick confidence check</h3><p>Check each component individually.</p></div><button class="text-link" data-action="device-check" aria-label="Run a device check">${icon('arrow')}</button></section>
    </aside></div>`;
}
function checkCards() {
  return `<div class="check-grid">${device.check().map(c => `<div class="check-item ${c.status !== 'passed' ? 'fail' : ''}" data-component="${c.id}"><strong>${esc(c.label)}</strong>${pill(c.status, c.status === 'passed' ? '' : 'pending')}<p>${esc(c.detail)}</p></div>`).join('')}</div>`;
}
function devicePage() {
  const d = device.getStatus(), r = deviceReadiness();
  return header('A closer look at your wearable.','Connection, contact, and individual component results.','MY DEVICE') + notices() + `
    <div class="wide-grid"><div class="main-stack"><section class="panel device-hero"><img src="./assets/wearable.svg" alt="CCEW wrist wearable concept"><div><span class="status-tag readiness-${r.status}">${r.badge}</span><h2>CCEW-024</h2><p>Wrist-worn companion<br>Simulated Bluetooth device</p><button class="button" data-action="${d.current ? 'demo-controls' : 'reconnect'}" ${['connecting','syncing'].includes(d.connection) ? 'disabled' : ''}>${d.current ? 'Demo controls' : 'Reconnect'}</button></div></section>
    <section class="panel panel-pad"><div class="panel-header"><h2>Component checks</h2></div>${checkCards()}<p class="audio-micro-note">Component availability does not confirm that a haptic command completed. Only a simulated wearable response does that.</p></section></div>
    <div class="side-stack"><section class="panel panel-pad"><div class="panel-header"><h2>Battery & charging</h2>${icon('battery')}</div><div class="battery-visual"><span class="battery-big">${d.battery}%</span><div class="battery-description"><strong>${!d.current ? 'Last known reading' : d.charging ? 'Charging via USB-C' : 'Simulated battery charge'}</strong>No measured runtime estimate</div></div><div class="battery-track"><span style="width:${d.battery}%"></span></div><div class="info-lines"><div class="info-line"><span>Battery-life design target</span><strong>&gt;12 hours</strong></div><div class="info-line"><span>Hardware runtime</span><strong>Not measured</strong></div><div class="info-line"><span>Charging method</span><strong>USB-C</strong></div></div><p class="small-description">More than 12 hours is the design requirement. Battery percentage is simulated and is not a runtime prediction.</p></section>
    <section class="panel panel-pad"><h2>Try failure conditions</h2><p class="small-description section-gap">Disconnect during transfer, fail a sensor, or confirm a haptic command in Demo controls.</p><button class="button full section-gap" data-action="demo-controls">Open demo controls</button></section></div></div>`;
}
function eventCard(event) {
  const type = TYPES[event.type] || TYPES.manual;
  return `<button class="panel event-card" data-action="event" data-id="${esc(event.id)}"><span class="row-symbol">${icon(type.icon)}</span><span class="row-main"><span class="row-title">${type.title}</span><span class="row-subtitle event-id">${esc(event.id)}</span><span class="row-subtitle">${stamp(event.detectedAt)}</span><span class="row-subtitle">${event.responder ? `Reply: ${esc(event.responder.name)} · ${esc(HAPTIC[event.haptic.status])}` : `Phone transfer: ${esc(event.transfer.status)} · Contact delivery: ${esc(event.delivery.status)}`}</span><span class="row-subtitle">Audio: ${esc(audio.description(event))}</span></span><span class="event-meta">${statusPill(event)}</span></button>`;
}
function alertsPage() {
  const events = alerts.visible().filter(e => (typeFilter === 'all' || e.type === typeFilter) && (statusFilter === 'all' || statusFilter === 'pending' && e.acknowledgedAt === null || statusFilter === 'acknowledged' && e.acknowledgedAt !== null || statusFilter === 'failed' && e.delivery.status === 'failed'));
  return header('A clear picture of every alert.','Detection, receipt, delivery, reply, and wrist feedback stay separate.','ALERT HISTORY') + notices() + `
    <div class="alerts-toolbar"><label class="filter-label">Reply status<select id="status-filter">${[['all','All statuses'],['pending','Awaiting reply'],['acknowledged','Acknowledged'],['failed','Delivery failed']].map(([value,label]) => `<option value="${value}" ${statusFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="filter-label">Event type<select id="type-filter"><option value="all">All types</option>${Object.entries(TYPES).map(([value,t]) => `<option value="${value}" ${typeFilter === value ? 'selected' : ''}>${t.title}</option>`).join('')}</select></label><button class="button" data-action="send-alert" ${!ble.isReady() ? 'disabled' : ''}>${icon('plus')} Phone alert</button></div>
    ${!ble.isReady() ? '<div class="queue-callout section-gap">The phone cannot see new wearable events while disconnected. Its history shows only events already received. Use Demo controls to inspect the simulated wearable queue.</div>' : ''}
    <div class="event-list section-gap">${events.map(eventCard).join('') || '<section class="panel empty-state"><h2>No matching events.</h2><p>Events appear here after the phone receives them.</p></section>'}</div><p class="event-demo-label">${icon('info')} All messages and recordings are simulated.</p>`;
}
function contactsPage() {
  const contacts = store.state.contacts;
  return header('Your people, within reach.','Choose a primary contact and order your backups.','SAFETY CONTACTS') + `<div class="panel-header"><h2>${contacts.length} safety contact${contacts.length === 1 ? '' : 's'}</h2><button class="button primary" data-action="add-contact">${icon('plus')} Add contact</button></div>
    <div class="contact-grid">${contacts.map((c,i) => `<section class="panel contact-profile" data-contact-id="${esc(c.id)}"><div class="contact-profile-top"><div class="avatar ${i ? 'rose' : ''}">${esc(initials(c.name))}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.role)}</p></div></div><div class="contact-details"><div>${icon('phone')} ${esc(c.phone)}</div><div>${icon('mail')} ${esc(c.email || 'No email added')}</div></div>${pill(i ? `Backup ${i}` : 'Primary contact', i ? 'neutral' : '')}<div class="contact-actions"><button class="button" data-action="primary-contact" data-id="${esc(c.id)}" ${!i ? 'disabled' : ''}>${i ? 'Make primary' : 'Primary selected'}</button>${i ? `<button class="button" data-action="move-contact" data-id="${esc(c.id)}" data-direction="-1" ${i === 1 ? 'disabled' : ''} aria-label="Move ${esc(c.name)} up">↑</button><button class="button" data-action="move-contact" data-id="${esc(c.id)}" data-direction="1" ${i === contacts.length - 1 ? 'disabled' : ''} aria-label="Move ${esc(c.name)} down">↓</button>` : ''}<button class="button" data-action="edit-contact" data-id="${esc(c.id)}">Edit</button><button class="button danger-link" data-action="delete-contact" data-id="${esc(c.id)}">Remove</button></div></section>`).join('') || '<section class="panel empty-state"><h2>Add someone you trust.</h2><p>No contacts are configured for simulated delivery.</p></section>'}</div><section class="panel panel-pad section-gap"><h2>History stays accurate</h2><p class="small-description section-gap">Each delivery saves its recipient list. Reordering or deleting a contact does not rewrite the names on old acknowledgements.</p></section>`;
}
function settingsPage() {
  const s = store.state;
  return header('Make it feel like yours.','Your profile and local demonstration preferences.','SETTINGS') + `<div class="wide-grid"><div class="main-stack"><section class="panel profile-panel"><h2>Your responder profile</h2><form id="profile-form" class="section-gap"><label class="form-field">Full name<input name="name" required maxlength="70" value="${esc(s.profile.name)}"></label><label class="form-field">Role<input name="role" required maxlength="70" value="${esc(s.profile.role)}"></label><label class="form-field">Team / organization<input name="organization" maxlength="90" value="${esc(s.profile.organization)}"></label><button class="button primary" type="submit">Save profile</button></form></section><section class="panel panel-pad"><h2>Display & notices</h2>${[['disconnectNotice','Connection notices'],['contactNotice','Skin-contact notices'],['reducedMotion','Reduce motion']].map(([key,label]) => `<div class="demo-option"><h3>${label}</h3><button class="switch" role="switch" aria-label="${label}" aria-checked="${s.settings[key]}" data-action="setting-toggle" data-key="${key}"></button></div>`).join('')}</section></div><div class="side-stack"><section class="panel panel-pad"><h2>A reply you can feel</h2><p class="small-description section-gap">A contact reply requests wrist feedback. A sent command stays unconfirmed until the simulated wearable responds.</p><label class="form-field section-gap">Acknowledgement pattern<select id="haptic-pattern">${['Two short pulses','One long pulse'].map(p => `<option ${s.settings.hapticPattern === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label><button class="button full" data-action="haptic-test">Preview pattern</button></section><section class="panel panel-pad"><h2>About this prototype</h2><p class="small-description section-gap">No real Bluetooth, microphone, contact messages, or emergency services. Battery-life design target: more than 12 hours; hardware runtime has not been measured.</p><button class="button full section-gap" data-action="demo-controls">Open demo controls</button></section></div></div>`;
}

function showModal(content, kind = '') {
  audio.stop(); activeEvent = null; modal.dataset.kind = kind;
  modal.innerHTML = `<button class="modal-close" data-action="close-modal" aria-label="Close dialog">${icon('x')}</button>${content}`;
  if (!modal.open) modal.showModal();
}
function closeModal() { audio.stop(); if (modal.open) modal.close(); activeEvent = null; modal.dataset.kind = ''; }
modal.addEventListener('close', () => { if (!modal.open) { audio.stop(); activeEvent = null; } });
function alertModal() {
  if (!ble.isReady()) { toast('Reconnect before creating an alert from the phone.',true); return; }
  showModal(`<p class="demo-label">PHONE ACTION · SIMULATED</p><h2 id="modal-title" class="modal-title">Send a phone alert?</h2><p class="modal-lead">This creates a phone-originated alert. To test a physical wearable button, use Demo controls. Contact delivery and replies are simulated separately.</p>${contactSummary()}<div class="modal-actions"><button class="button" data-action="close-modal">Cancel</button><button class="button danger" data-action="confirm-alert" ${!store.state.contacts.length ? 'disabled' : ''}>Create phone alert</button></div>`, 'phone-alert');
}
function demoOption(title, detail, control) { return `<div class="demo-option"><div><h3>${title}</h3><p>${detail}</p></div>${control}</div>`; }
function demoModal() {
  const s = store.state, t = s.device.telemetry;
  const toggle = (action,label,checked) => `<button class="switch" role="switch" aria-label="${label}" aria-checked="${checked}" data-action="${action}"></button>`;
  showModal(`<p class="demo-label">SIMULATOR · NOT LIVE DEVICE DATA</p><h2 id="modal-title" class="modal-title">Try the moments that matter.</h2><p class="modal-lead">Wearable actions can occur offline. Phone controls never create events on a disconnected wearable.</p>
    <p class="queue-callout" data-simulator-summary></p>
    <fieldset class="demo-group"><legend>Wearable & connection</legend>
      ${demoOption('Bluetooth connection', '<span data-demo-connection>' + esc(s.device.connection) + '</span> · reconnect shows Connecting and Syncing.', toggle('demo-connection','Demo Bluetooth connection',s.device.connection !== 'disconnected'))}
      ${demoOption('Wearable alarm button','Creates a hardware-side event even outside Bluetooth range.','<button class="button" data-action="simulate-alarm">Press button</button>')}
      ${demoOption('Skin contact','Loss must be stable for 1.5 seconds before a removal alert.',toggle('demo-contact','Demo skin contact',t.rawWorn))}
      ${demoOption('Brief contact loss','A 400ms interruption should create no removal alert.','<button class="button" data-action="brief-contact">Try brief loss</button>')}
      ${demoOption('Low battery',`${t.battery}% simulated charge. Design target: &gt;12 hours.`,toggle('demo-battery','Demo low battery',t.battery <= 20))}
      ${demoOption('USB-C charging','Charging does not fabricate a charge or runtime estimate.',toggle('demo-charging','Demo USB-C charging',t.charging))}
    </fieldset>
    <fieldset class="demo-group"><legend>Fall scenarios</legend>
      ${demoOption('Possible fall','Repeated detections keep the original deadline.','<button class="button" data-action="simulate-fall">Trigger / repeat</button>')}
      ${demoOption('Physical cancellation','A wearable-side cancellation works without the phone.','<button class="button" data-action="wearable-cancel-fall">Cancel on wearable</button>')}
      ${demoOption('Interrupted session','Reload while preserving the original check-in deadline.','<button class="button" data-action="interrupt-fall">Save & reload</button>')}
      <p class="small-description" data-fall-summary></p>
    </fieldset>
    <fieldset class="demo-group"><legend>Independent component faults</legend>
      ${['motion','contact','audio','haptic'].map(name => demoOption(`${name[0].toUpperCase() + name.slice(1)} failure`, 'Tests this component independently of Bluetooth.', `<button class="switch" role="switch" aria-label="Demo ${name} failure" aria-checked="${t.components[name] === 'failed'}" data-action="component-failure" data-key="${name}"></button>`)).join('')}
    </fieldset>
    <fieldset class="demo-group"><legend>Delivery, replies & feedback</legend>
      ${demoOption('Fail contact delivery','The phone receives the event, but contact delivery fails.',toggle('delivery-failure','Demo delivery failure',s.simulation.deliveryFailure))}
      <label class="form-field">Reply from<select id="demo-responder">${s.contacts.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
      <button class="button full" data-action="ack-latest">Acknowledge latest delivered event</button>
      <p class="small-description section-gap">Open an acknowledged event in Alerts to confirm or fail its haptic command. Reconnecting alone never confirms completion.</p>
      ${demoOption('Duplicate packet','Replay an existing ID; history must not gain a duplicate.','<button class="button" data-action="replay-event">Replay packet</button>')}
    </fieldset>
    <div class="modal-actions"><button class="button ghost" data-action="reset-demo">Reset demo data</button><button class="button primary" data-action="close-modal">Done</button></div>`, 'demo');
  syncModal();
}
function eventDetails(event) {
  const rows = [
    ['Event detected',event.detectedAt, event.source === 'phone' ? 'Phone-originated alert' : 'Simulated wearable event'],
    ['Received by phone',event.receivedAt,`Metadata: ${event.transfer.status}`],
    ['Delivered to safety contacts',event.deliveredAt, event.delivery.reason || `Simulated delivery: ${event.delivery.status}`],
    ['Safety contact acknowledged',event.acknowledgedAt,event.responder ? event.responder.name : 'Waiting for a selected contact to reply'],
    ['Wearable feedback completed',event.haptic.confirmedAt,HAPTIC[event.haptic.status]]
  ];
  return statusPill(event) + `<ol class="timeline">${rows.map(([label,at,detail]) => `<li><span class="timeline-dot ${at === null ? 'waiting' : ''}"></span><div><strong>${label}</strong><p>${stamp(at)}<br>${esc(detail)}</p></div></li>`).join('')}</ol><div class="queue-callout">Haptic: ${esc(HAPTIC[event.haptic.status])}${event.haptic.reason ? ' · ' + esc(event.haptic.reason) : ''}<br>Command ID: <span class="event-id">${esc(event.haptic.commandId || 'Not requested')}</span> · Attempts: ${event.haptic.attempts}</div>`;
}
function eventModal(id) {
  const event = alerts.visible().find(e => e.id === id); if (!event) return;
  showModal(`<p class="demo-label">SIMULATED ${event.source.toUpperCase()} EVENT</p><h2 id="modal-title" class="modal-title">${TYPES[event.type]?.title || 'Alert'}</h2><p class="event-id">${esc(event.id)}</p><div data-event-details></div>
    <div class="audio-block"><div class="audio-summary"><strong>Event audio</strong><span data-audio-status></span></div>${wave()}<div class="audio-controls"><button class="play-button" data-action="play-audio" aria-label="Play synthetic audio sample">${icon('play')}</button><input class="audio-range" id="audio-seek" aria-label="Seek in synthetic audio" type="range" min="0" max="40" step=".1" value="0"><span class="audio-time" id="audio-time">0:00 / 0:40</span></div><p class="playback-state" id="playback-state"></p></div><p class="audio-micro-note">20s before + 20s after. Download and playback use generated quiet tones, not microphone recordings.</p>
    <label class="form-field">Simulate a reply from<select id="ack-contact">${event.recipients.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>
    <div class="event-actions"><button class="button primary" data-action="ack-event" data-id="${esc(id)}">Simulate acknowledgement</button><button class="button" data-action="retry-delivery" data-id="${esc(id)}">Retry delivery</button><button class="button" data-action="retry-haptic" data-id="${esc(id)}">Retry feedback</button><button class="button" data-action="confirm-haptic" data-id="${esc(id)}">Simulate wearable confirmation</button><button class="button" data-action="fail-haptic" data-id="${esc(id)}">Simulate motor failure</button><button class="button" data-action="download-audio">${icon('download')} Synthetic audio</button></div><div class="modal-actions"><button class="button" data-action="close-modal">Done</button></div>`, 'event');
  activeEvent = id; syncModal();
}
function syncModal() {
  if (!modal.open) return;
  if (modal.dataset.kind === 'demo') {
    modal.querySelector('[data-simulator-summary]').textContent = `Simulator only: ${alerts.queued().length} event(s) awaiting phone receipt. This physical queue is hidden from the disconnected phone UI.`;
    modal.querySelector('[data-demo-connection]').textContent = store.state.device.connection;
    const fall = store.state.fall;
    const previousFall = store.state.fallHistory[0];
    modal.querySelector('[data-fall-summary]').textContent = fall ? `Active: ${Math.max(0,Math.ceil((fall.dueAt - store.now())/1000))}s remaining · ${fall.repeats} repeat(s).` : previousFall ? `Last check-in: ${previousFall.outcome} · ${exactTime(previousFall.endedAt)} · ${previousFall.repeats} repeat(s).` : 'No active fall check-in.';
    modal.querySelector('[data-action="wearable-cancel-fall"]').disabled = !fall;
    modal.querySelector('[data-action="interrupt-fall"]').disabled = !fall;
    return;
  }
  if (modal.dataset.kind !== 'event' || !activeEvent) return;
  const event = alerts.get(activeEvent); if (!event) return;
  const details = modal.querySelector('[data-event-details]');
  const html = eventDetails(event); if (details.innerHTML !== html) details.innerHTML = html;
  modal.querySelector('[data-audio-status]').textContent = audio.description(event);
  const ready = event.audio.status === 'ready';
  modal.querySelectorAll('[data-action="play-audio"],[data-action="download-audio"],#audio-seek').forEach(el => el.disabled = !ready);
  modal.querySelector('[data-action="ack-event"]').disabled = event.delivery.status !== 'delivered' || event.acknowledgedAt !== null;
  const recipientSelect = modal.querySelector('#ack-contact');
  const recipientKey = JSON.stringify(event.recipients.map(c => [c.id,c.name]));
  if (recipientSelect.dataset.recipients !== recipientKey) {
    const selected = recipientSelect.value;
    recipientSelect.innerHTML = event.recipients.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    if (event.recipients.some(c => c.id === selected)) recipientSelect.value = selected;
    recipientSelect.dataset.recipients = recipientKey;
  }
  if (event.responder && event.recipients.some(c => c.id === event.responder.id)) recipientSelect.value = event.responder.id;
  recipientSelect.disabled = event.acknowledgedAt !== null || event.delivery.status !== 'delivered';
  modal.querySelector('[data-action="retry-delivery"]').hidden = event.delivery.status !== 'failed';
  modal.querySelector('[data-action="retry-haptic"]').hidden = event.haptic.status !== 'failed';
  modal.querySelectorAll('[data-action="confirm-haptic"],[data-action="fail-haptic"]').forEach(el => { el.hidden = event.acknowledgedAt === null || event.haptic.status === 'successful'; el.disabled = event.haptic.status !== 'sent' || !ble.isReady(); });
  const playing = audio.player && !audio.player.paused;
  const button = modal.querySelector('[data-action="play-audio"]'); button.innerHTML = icon(playing ? 'pause' : 'play'); button.setAttribute('aria-label',playing ? 'Pause synthetic audio sample' : 'Play synthetic audio sample');
  modal.querySelector('#playback-state').textContent = playing ? 'Playing synthetic tones. No real recording.' : audio.description(event);
  if (audio.player) {
    const seconds = audio.player.currentTime;
    modal.querySelector('#audio-seek').value = seconds;
    modal.querySelector('#audio-time').textContent = `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')} / 0:40`;
  }
}
audio.onPlayback = syncModal;
function contactModal(id) {
  const c = store.state.contacts.find(c => c.id === id) || { id:'', name:'', role:'', phone:'', email:'' };
  showModal(`<h2 id="modal-title" class="modal-title">${id ? 'Edit safety contact' : 'Add someone you trust'}</h2><form id="contact-form" data-id="${esc(c.id)}">${[['name','Full name','text'],['role','Relationship / role','text'],['phone','Phone number','tel'],['email','Email (optional)','email']].map(([key,label,type]) => `<label class="form-field">${label}<input name="${key}" type="${type}" maxlength="${key === 'email' ? 120 : 70}" ${key !== 'email' ? 'required' : ''} value="${esc(c[key])}"></label>`).join('')}<div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save contact</button></div></form>`, 'contact');
}
function deviceCheck() {
  showModal(`<p class="demo-label">SIMULATED COMPONENT CHECK</p><h2 id="modal-title" class="modal-title">A moment to check in.</h2>${checkCards()}<p class="small-description section-gap">Each result uses its own simulated sensor state. Unknown is not a pass. This does not test hardware.</p><div class="modal-actions"><button class="button primary" data-action="close-modal">Done</button></div>`, 'check');
}
function refreshDemo() { const top = modal.scrollTop; demoModal(); modal.scrollTop = top; }
function afterAction(message) { render(); syncModal(); if (message) toast(message); }

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action],[data-view]'); if (!target || target.disabled) return;
  event.preventDefault();
  if (target.dataset.view) { navTo(target.dataset.view); return; }
  const { action, id, key } = target.dataset;
  switch (action) {
    case 'close-modal': closeModal(); break;
    case 'send-alert': alertModal(); break;
    case 'confirm-alert': {
      const created = alerts.requestFromPhone();
      if (!created) { closeModal(); afterAction('Connection changed. No phone alert was created.'); break; }
      navTo('alerts'); eventModal(created.id); afterAction('Phone alert received locally. Contact delivery is pending.'); break;
    }
    case 'event': eventModal(id); break;
    case 'demo-controls': demoModal(); break;
    case 'demo-connection':
      if (store.state.device.connection === 'disconnected') ble.connect(); else ble.disconnect();
      render(); refreshDemo(); if (store.state.settings.disconnectNotice) toast('Simulated connection: ' + store.state.device.connection); break;
    case 'reconnect': ble.connect(); afterAction(); break;
    case 'simulate-alarm': demo.pressButton(); render(); syncModal(); toast('Simulator: physical button event stored. Phone receipt is a separate step.'); break;
    case 'demo-contact': demo.setContact(!store.state.device.telemetry.rawWorn); render(); refreshDemo(); break;
    case 'brief-contact': demo.briefContactLoss(); render(); syncModal(); toast('Simulator: 400ms contact interruption.'); break;
    case 'demo-battery': demo.setBattery(store.state.device.telemetry.battery <= 20 ? 84 : 14); render(); refreshDemo(); break;
    case 'demo-charging': device.updateTelemetry({ charging: !store.state.device.telemetry.charging }); render(); refreshDemo(); break;
    case 'component-failure': demo.setComponent(key, store.state.device.telemetry.components[key] === 'ok' ? 'failed' : 'ok'); render(); refreshDemo(); break;
    case 'delivery-failure': store.state.simulation.deliveryFailure = !store.state.simulation.deliveryFailure; store.save(); refreshDemo(); break;
    case 'simulate-fall': {
      const fall = demo.startFall(); if (!fall) { toast('Simulator: motion sensor is failed.',true); break; }
      closeModal(); afterAction(fall.repeats ? 'Repeated detection recorded. The original deadline is unchanged.' : 'Simulator: possible fall check-in started.'); break;
    }
    case 'cancel-fall': if (demo.cancelFall()) afterAction('Fall check-in cancelled. No alert created.'); else toast('Reconnect to cancel from the phone.',true); break;
    case 'wearable-cancel-fall': demo.cancelFall({ fromPhone:false }); render(); syncModal(); break;
    case 'interrupt-fall': demo.interruptSession(); location.reload(); break;
    case 'ack-event': {
      const contactId = modal.querySelector('#ack-contact')?.value;
      if (alerts.acknowledge(id,contactId)) { haptics.tick(); afterAction('Reply received. Wrist feedback still needs wearable confirmation.'); }
      break;
    }
    case 'ack-latest': {
      const latest = alerts.visible().find(e => e.deliveredAt !== null && e.acknowledgedAt === null);
      const selected = modal.querySelector('#demo-responder').value;
      if (latest && alerts.acknowledge(latest.id,selected)) { haptics.tick(); render(); syncModal(); toast('Selected contact replied. Haptic completion is unconfirmed.'); }
      else toast('No delivered event can be acknowledged by that contact. Open an event to see its recipients.',true);
      break;
    }
    case 'retry-delivery': alerts.retryDelivery(id); afterAction(); break;
    case 'retry-haptic': haptics.retry(id); haptics.tick(); afterAction(); break;
    case 'confirm-haptic': case 'fail-haptic': demo.confirmHaptic(id,action === 'confirm-haptic'); afterAction(); break;
    case 'replay-event': {
      const latest = store.state.events[0]; if (latest) alerts.detect(latest.type,{ id:latest.id, detectedAt:latest.detectedAt });
      toast('Existing event ID replayed; no duplicate created.'); syncModal(); break;
    }
    case 'device-check': deviceCheck(); break;
    case 'haptic-test': showModal(`<h2 id="modal-title" class="modal-title">A visual pattern preview</h2><p class="modal-lead">${esc(store.state.settings.hapticPattern)}. This preview does not send a command or mark feedback completed.</p><div class="pattern-preview" aria-hidden="true">${store.state.settings.hapticPattern === 'Two short pulses' ? '━━　━━' : '━━━━━━━━'}</div><div class="modal-actions"><button class="button" data-action="close-modal">Done</button></div>`); break;
    case 'add-contact': contactModal(); break;
    case 'edit-contact': contactModal(id); break;
    case 'primary-contact': {
      const index = store.state.contacts.findIndex(c => c.id === id);
      if (index > 0) store.state.contacts.unshift(...store.state.contacts.splice(index,1));
      store.save(); afterAction('Primary contact updated.'); break;
    }
    case 'move-contact': {
      const contacts = store.state.contacts, from = contacts.findIndex(c => c.id === id), to = from + Number(target.dataset.direction);
      if (from > 0 && to > 0 && to < contacts.length) [contacts[from],contacts[to]] = [contacts[to],contacts[from]];
      store.save(); afterAction(); break;
    }
    case 'delete-contact': {
      const contact = store.state.contacts.find(c => c.id === id); if (!contact) break;
      const next = store.state.contacts[1];
      showModal(`<h2 id="modal-title" class="modal-title">Remove ${esc(contact.name)}?</h2><p class="modal-lead">This removes the contact from future deliveries. Existing recipient and reply records stay intact.${store.state.contacts[0].id === id && next ? ` ${esc(next.name)} becomes primary.` : ''}</p><label class="confirm-check"><input type="checkbox" id="delete-confirm"> I want to remove this safety contact.</label><div class="modal-actions"><button class="button" data-action="close-modal">Keep contact</button><button class="button danger" data-action="confirm-delete" data-id="${esc(id)}" disabled>Remove contact</button></div>`, 'delete'); break;
    }
    case 'confirm-delete':
      if (!modal.querySelector('#delete-confirm')?.checked) break;
      store.state.contacts = store.state.contacts.filter(c => c.id !== id); store.save(); closeModal(); afterAction('Contact removed from future simulated deliveries.'); break;
    case 'setting-toggle':
      if (!['disconnectNotice','contactNotice','reducedMotion'].includes(key)) break;
      store.state.settings[key] = !store.state.settings[key]; store.save(); afterAction(); break;
    case 'reset-demo': showModal(`<h2 id="modal-title" class="modal-title">Reset demo data?</h2><p class="modal-lead">This replaces saved profile edits, contacts, events, and pending simulator work with sample data.</p><div class="modal-actions"><button class="button" data-action="close-modal">Keep changes</button><button class="button danger" data-action="confirm-reset">Reset demo</button></div>`); break;
    case 'confirm-reset': audio.stop(); store.reset(); statusFilter = typeFilter = 'all'; closeModal(); afterAction('Demo data reset.'); break;
    case 'play-audio': {
      const e = alerts.get(activeEvent); if (!e) break;
      try { await audio.play(e); syncModal(); } catch { toast('The browser could not play the synthetic sample.',true); }
      break;
    }
    case 'download-audio': {
      const e = alerts.get(activeEvent); if (e?.audio.status !== 'ready') break;
      const link = document.createElement('a'); link.href = audio.makeSampleURL(); link.download = 'CCEW-synthetic-demo-audio-40s.wav'; link.click(); break;
    }
  }
});
document.addEventListener('submit', event => {
  if (!['profile-form','contact-form'].includes(event.target.id)) return;
  event.preventDefault(); const data = new FormData(event.target);
  const value = name => String(data.get(name) || '').trim();
  if (event.target.id === 'profile-form') {
    if (!value('name') || !value('role')) return;
    store.state.profile = { name:value('name'), role:value('role'), organization:value('organization') }; store.save(); afterAction('Profile saved in this browser.');
  } else {
    if (!value('name') || !value('role') || value('phone').replace(/\D/g,'').length < 7) { toast('Enter a name, role, and a phone number with at least seven digits.',true); return; }
    const oldId = event.target.dataset.id;
    const contact = { id:oldId || store.id('contact'), name:value('name'), role:value('role'), phone:value('phone'), email:value('email') };
    if (oldId) store.state.contacts = store.state.contacts.map(c => c.id === oldId ? contact : c); else store.state.contacts.push(contact);
    store.save(); closeModal(); afterAction('Safety contact saved.');
  }
});
document.addEventListener('change', event => {
  switch (event.target.id) {
    case 'status-filter': statusFilter = event.target.value; render(); break;
    case 'type-filter': typeFilter = event.target.value; render(); break;
    case 'haptic-pattern': store.state.settings.hapticPattern = event.target.value; store.save(); break;
    case 'delete-confirm': modal.querySelector('[data-action="confirm-delete"]').disabled = !event.target.checked; break;
  }
});
document.addEventListener('input', event => {
  if (event.target.id === 'audio-seek' && audio.player) { audio.player.currentTime = Number(event.target.value); syncModal(); }
});
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'd' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !modal.open) { event.preventDefault(); demoModal(); }
});
function tick() {
  const before = store.revision;
  const previousDevice = device.getStatus();
  ble.tick(); demo.tick(); alerts.tick(); audio.tick(); haptics.tick();
  if (store.revision !== before) needsRender = true;
  const nextLabel = greeting() + new Date().toDateString();
  if (clockLabel !== nextLabel) { clockLabel = nextLabel; needsRender = true; }
  const nextDevice = device.getStatus();
  if (previousDevice.current && previousDevice.worn && nextDevice.current && !nextDevice.worn && store.state.settings.contactNotice) toast('Skin contact lost after a stable reading. A simulated removal event was recorded.');
  // Preserve text inputs and native selects during background simulator updates.
  const editing = document.querySelector('#main').contains(document.activeElement) && ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
  if (needsRender && !editing) render();
  document.querySelectorAll('[data-fall-count]').forEach(el => { const fall = device.visibleFall(); if (fall) el.textContent = Math.max(0,Math.ceil((fall.dueAt-store.now())/1000)); });
  syncModal();
}
app.render = render; app.navTo = navTo; app.tick = tick; app.greeting = greeting;
setInterval(tick,250);
window.addEventListener('beforeunload', () => audio.dispose());
hydrateIcons(); tick(); render();
if (store.storageFailed || !browserStorage) toast('Browser storage is unavailable. Changes last for this session only.',true);
