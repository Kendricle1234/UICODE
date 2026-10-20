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
const STORAGE = 'ccew-companion-ui-v1';
const seedTime = (h,m,days=0) => { const d=new Date();d.setDate(d.getDate()-days);d.setHours(h,m,0,0);return d.getTime(); };
const freshState = () => ({
 version:1, connected:true, worn:true, battery:84, charging:false, lastSync:Date.now(),
 profile:{name:'Alex Morgan', role:'Community responder', organization:'Community response team'},
 settings:{disconnectNotice:true, contactNotice:true, reducedMotion:false, hapticPattern:'Two short pulses'},
 contacts:[
  {id:'jordan',name:'Jordan Lee',role:'Team supervisor',phone:'(555) 010-0248',email:'jordan@example.com'},
  {id:'taylor',name:'Taylor Brooks',role:'Safety representative',phone:'(555) 010-0163',email:'taylor@example.com'}
 ],
 events:[
  {id:'sample-check',type:'test',created:seedTime(8,52),status:'acknowledged',received:seedTime(8,52),acknowledged:seedTime(8,53),ackBy:'Jordan Lee',audioReadyAt:seedTime(8,52)+20000,audioSynced:true,hapticPending:false},
  {id:'sample-fall',type:'fall',created:seedTime(15,24,1),status:'acknowledged',received:seedTime(15,24,1),acknowledged:seedTime(15,25,1),ackBy:'Taylor Brooks',audioReadyAt:seedTime(15,24,1)+20000,audioSynced:true,hapticPending:false}
 ], deviceOutbox:[],fallDue:null
});
let state;
try {
 const saved=JSON.parse(localStorage.getItem(STORAGE));
 state=saved?.version===1&&Array.isArray(saved.contacts)&&Array.isArray(saved.events)&&saved.settings&&saved.profile&&Array.isArray(saved.deviceOutbox)?saved:freshState();
} catch { state=freshState(); }
let view = location.hash.slice(1) || 'overview';
let filter='all', toastTimer, playingAudio=null, audioURL=null, activeEvent=null;
const modal=document.querySelector('#modal');
const TYPES={manual:{title:'Alarm button pressed',icon:'alert',short:'Manual alert'},fall:{title:'Fall detected',icon:'activity',short:'Fall alert'},removal:{title:'Device removal detected',icon:'contact',short:'Removal alert'},test:{title:'Device check completed',icon:'checkcircle',short:'Test alert'}};
const NAV=[['overview','home','Overview'],['device','watch','My device'],['alerts','bell','Alerts'],['contacts','users','Contacts'],['settings','settings','Settings']];
const pendingCount=()=>state.events.filter(e=>e.status==='awaiting').length;
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{toast('Browser storage is unavailable. Changes will last for this session.');}}
function announce(text){document.querySelector('#live-updates').textContent=text;}
function toast(text,error=false){const t=document.querySelector('#toast');t.textContent=text;t.classList.add('visible');t.classList.toggle('error',error);clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4200);announce(text);}
const time = stamp => new Date(stamp).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const date = stamp => new Date(stamp).toLocaleDateString('en-US',{month:'short',day:'numeric'});
const statusPill=e=>e.status==='acknowledged'?'<span class="pill">Acknowledged</span>':e.status==='cancelled'?'<span class="pill neutral">Cancelled</span>':'<span class="pill pending">Awaiting reply</span>';
const wave=()=>`<div class="waveform" aria-hidden="true">${Array.from({length:44},(_,i)=>`<span style="height:${8+Math.round(Math.abs(Math.sin(i*2.17)*Math.sin(i*.43))*28)}px"></span>`).join('')}</div>`;
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);el.removeAttribute('data-icon');});}

function navTo(target){if(target===view){render();return;}history.pushState(null,'','#'+target);view=target;closeModal();render();document.querySelector('#main').focus({preventScroll:true});window.scrollTo(0,0);}
window.addEventListener('hashchange',()=>{view=location.hash.slice(1)||'overview';closeModal();render();document.querySelector('#main').focus({preventScroll:true});window.scrollTo(0,0);});
function header(title,subtitle,eyebrow='YOUR COMPANION',action=''){
 return `<div class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-subtitle">${subtitle}</p></div><div class="header-actions">${action}<span class="demo-pill">DEMO DATA</span><button class="icon-button" data-view="alerts" aria-label="View alerts">${icon('bell')}</button><button class="header-avatar" data-view="settings" aria-label="Edit your profile">${esc(initials(state.profile.name))}</button></div></div>`;
}
function notices(){let html='';
 if(!state.connected)html+=`<div class="notice error">${icon('offline')}<span class="notice-copy"><strong>Wearable out of range.</strong> Device status is last known. Events stored on the wearable will sync when it reconnects.</span><button class="button" data-action="reconnect">Reconnect</button></div>`;
 if(state.connected&&!state.worn)html+=`<div class="notice">${icon('contact')}<span class="notice-copy"><strong>Check the fit of your wearable.</strong> Skin contact is not detected.</span><button class="button" data-view="device">View device</button></div>`;
 if(state.battery<=20)html+=`<div class="notice">${icon('battery')}<span class="notice-copy"><strong>${state.connected?'Battery is low':'Last known battery was low'} (${state.battery}%).</strong> ${state.connected?'Connect the wearable to a USB-C charger.':'Reconnect to update the battery status.'}</span></div>`;
 if(state.fallDue)html+=`<div class="notice error">${icon('activity')}<span class="notice-copy"><strong>Possible fall detected.</strong> A demo alert will be created in <span data-fall-count>${Math.max(0,Math.ceil((state.fallDue-Date.now())/1000))}</span>s.</span><button class="button" data-action="cancel-fall">I'm okay</button></div>`;
 return html;
}
function render(){
 if(!NAV.some(n=>n[0]===view))view='overview';
 document.body.classList.toggle('reduced-motion',state.settings.reducedMotion);
 document.title=`${NAV.find(n=>n[0]===view)[2]} · CCEW Companion`;
 document.querySelector('#desktop-nav').innerHTML=NAV.map(([id,i,name])=>`<a class="nav-link ${view===id?'active':''}" ${view===id?'aria-current="page"':''} href="#${id}">${icon(i)}<span class="nav-label">${name}</span>${id==='alerts'&&pendingCount()?`<span class="nav-number">${pendingCount()}</span>`:''}</a>`).join('');
 document.querySelector('#mobile-nav').innerHTML=NAV.map(([id,i,name])=>`<a class="${view===id?'active':''}" ${view===id?'aria-current="page"':''} href="#${id}">${icon(i)}<span>${name==='My device'?'Device':name}</span></a>`).join('');
 document.querySelector('#sidebar-connection').innerHTML=`<span class="small-dot" style="${!state.connected?'background:#bb967b':''}"></span><span><strong>${state.connected?'Wearable connected':'Wearable disconnected'}</strong><small>CCEW-024 · ${state.battery}% battery${!state.connected?' (last seen)':''}</small></span>`;
 document.querySelector('#main').innerHTML=({overview:overviewPage,device:devicePage,alerts:alertsPage,contacts:contactsPage,settings:settingsPage}[view])();
 hydrateIcons();
}
function contactSummary(){return state.contacts.slice(0,2).map((c,i)=>`<div class="contact"><div class="avatar ${i%2?'rose':''}">${esc(initials(c.name))}</div><div><div class="name">${esc(c.name)}</div><div class="role">${esc(c.role)}</div></div><span class="contact-priority">${i===0?'PRIMARY':'BACKUP'}</span></div>`).join('')||'<p class="small-description">Add a safety contact before sending an alert.</p>';}
function activityRow(e){const t=TYPES[e.type]||TYPES.manual;return `<button class="activity-row" data-action="event" data-id="${esc(e.id)}"><span class="row-symbol ${e.type==='manual'||e.type==='removal'?'alert':''}">${icon(t.icon)}</span><span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-subtitle" style="display:block">${e.status==='acknowledged'?`Acknowledged by ${esc(e.ackBy)}`:'Waiting for a safety contact to reply'}</span></span><span class="row-time">${date(e.created)}<br>${time(e.created)}</span></button>`;}
function deviceReadiness(){
 // Keep urgent check-ins visible; disconnected sensor readings are last known.
 if(state.fallDue)return {
  status:'urgent', badge:'FALL CHECK-IN', heading:'Are you okay?',
  description:state.connected?'A possible fall was detected. Tap “I’m okay” above to cancel the check-in.':'A simulated fall check-in is active. Tap “I’m okay” above to cancel. Bluetooth is disconnected; device readings are last known.'
 };
 if(!state.connected)return {
  status:'disconnected', badge:'CONNECTION LOST', heading:'Let’s get you reconnected.',
  description:'Device readings are last known. Keep your phone nearby; queued events will sync after reconnection.'
 };
 if(!state.worn)return {
  status:'warning', badge:'SKIN CONTACT LOST', heading:'Check your wearable.',
  description:'Skin contact is not detected. Adjust the strap so your wearable sits securely against your wrist.'
 };
 if(state.battery<=20)return {
  status:'warning', badge:'LOW BATTERY', heading:'Time to recharge.',
  description:`Your wearable battery is at ${state.battery}%. ${state.charging?'Keep it connected to USB-C while it recharges.':'Connect it to a USB-C charger.'}`
 };
 return {
  status:'normal', badge:'WEARABLE CONNECTED', heading:'Ready when you need it.',
  description:'Your wearable and phone are in sync. One less thing on your mind.'
 };
}
function overviewPage(){
 const readiness=deviceReadiness();
 const first=esc(state.profile.name.split(' ')[0]||'there');
 return header(`Good morning, ${first}.`,'A quick check before you head out.',new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}))+notices()+`
 <div class="content-grid"><div class="main-stack">
 <section class="panel hero" aria-label="Wearable connection overview"><div class="hero-copy"><span class="status-tag readiness-${readiness.status}"><span class="small-dot"></span>${readiness.badge}</span><h2>${readiness.heading}</h2><p>${readiness.description}</p><button class="text-link" data-view="device">${state.connected?'Manage device':'Check connection'} ${icon('arrow')}</button></div><img class="wearable-illustration" src="./assets/wearable.svg" alt="Concept illustration of the CCEW wrist-worn alert device"><div class="hero-bottom"><span class="hero-device-name">${icon('watch')} CCEW-024 <span style="color:#adb79e">/</span> Wrist wearable</span><span class="hero-sync">${icon('sync')} ${state.connected?'Synced just now':'Last seen '+time(state.lastSync)}</span></div></section>
 <div class="metrics"><section class="panel metric"><p class="metric-label">Device battery ${icon('battery')}</p><div class="metric-value ${state.battery<=20?'':'good-text'}">${state.battery}<span style="font-size:13px">%</span></div><div class="metric-detail">${!state.connected?'Last known level':state.charging?'Charging via USB-C':state.battery<=20?'Connect a USB-C charger':'Ready for your day'}</div><div class="battery-track"><span style="width:${state.battery}%;${state.battery<=20?'background:#c39b61':''}"></span></div></section><section class="panel metric"><p class="metric-label">Skin contact ${icon('contact')}</p><div class="metric-value good-text">${!state.connected?'Unknown':state.worn?'On wrist':'Check fit'}</div><div class="metric-detail">${!state.connected?'Reconnect to update':state.worn?'Contact detected':'Contact not detected'}</div></section><section class="panel metric"><p class="metric-label">Fall detection ${icon('activity')}</p><div class="metric-value good-text">${state.connected?'Active':'Last seen'}</div><div class="metric-detail">${state.connected?'Motion sensing is on':'Active before disconnect'}</div></section></div>
 <section class="alert-banner"><div class="alert-icon">${icon('alert')}</div><div class="alert-copy"><h2>Support, a tap away.</h2><p>Send an alert to your safety contacts.</p></div><button class="button danger" data-action="send-alert">Send alert ${icon('arrow')}</button></section>
 <section class="panel recent-panel"><div class="panel-header"><h2>Recent activity</h2><button class="text-link" data-view="alerts">View all ${icon('arrow')}</button></div>${[...state.events].sort((a,b)=>b.created-a.created).slice(0,3).map(activityRow).join('')||'<p class="small-description" style="padding-bottom:20px">No alerts yet. A little quiet is a good thing.</p>'}</section>
 </div><aside class="side-stack" aria-label="Audio and safety contacts">
 <section class="panel audio-card"><div class="audio-top"><span class="audio-symbol">${icon('mic')}</span><span class="audio-state"><span class="small-dot"></span>${state.connected?'Rolling buffer active':'Last seen buffering'}</span></div><h2>A little context.<br>When it matters.</h2><p>Audio around an alert gives your safety contacts a clearer picture.</p>${wave()}<div class="wave-labels"><span>20s BEFORE</span><span>ALERT</span><span>20s AFTER</span></div><div class="audio-footer">${icon('lock')} ${state.connected?'Saved with an alert event':'Recording status updates on reconnect'}</div></section>
 <section class="panel contacts-card"><div class="panel-header"><h2>Your safety circle</h2><button class="text-link" data-view="contacts" aria-label="Manage safety contacts">${icon('edit')}</button></div>${contactSummary()}<p class="contacts-note">${state.contacts.length?'These are the people notified when you need support.':'Your safety contacts will appear here.'}</p></section>
 <section class="small-panel">${icon('checkcircle')}<div><h3>A quick confidence check</h3><p>Test your connection and feedback.</p></div><button class="text-link" data-action="device-check" aria-label="Run a device check">${icon('arrow')}</button></section>
 </aside></div>`;
}
function settingRow(symbol,title,description,right){return `<div class="setting-row"><span class="setting-symbol">${icon(symbol)}</span><div class="row-main"><strong>${title}</strong><p>${description}</p></div>${right}</div>`;}
function switchButton(key,label,checked){return `<button class="switch" role="switch" aria-label="${esc(label)}" aria-checked="${checked}" data-action="setting-toggle" data-key="${key}"></button>`;}
function devicePage(){return header('A closer look at your wearable.','Connection, contact, and a little everyday reassurance.','MY DEVICE')+notices()+`
 <div class="wide-grid"><div class="main-stack"><section class="panel device-hero"><img src="./assets/wearable.svg" alt="CCEW wrist wearable concept"><div><span class="status-tag"><span class="small-dot"></span>${state.connected?'CONNECTED VIA BLUETOOTH':'BLUETOOTH DISCONNECTED'}</span><h2>CCEW-024</h2><p>Your wrist-worn<br>community response companion.</p><div class="device-info"><span>Paired to this phone</span><span>Demo device</span></div></div></section>
 <section class="panel"><div class="settings-heading"><h2>The essentials</h2></div><div class="settings-list">${settingRow('bluetooth','Bluetooth connection',state.connected?'Your phone and wearable are in sync.':'Wearable events are stored until it reconnects.',`<button class="button" data-action="${state.connected?'pairing-info':'reconnect'}">${state.connected?'Details':'Reconnect'}</button>`)}${settingRow('contact','Skin contact',!state.connected?'Current contact is unknown until reconnection.':state.worn?'Contact is detected at the back of your wearable.':'Adjust the strap so the contacts meet your skin.',`<span class="pill ${!state.connected||!state.worn?'pending':''}">${!state.connected?'Unknown':state.worn?'Detected':'Check fit'}</span>`)}${settingRow('activity','Fall detection','Motion sensing supports automatic fall alerts.',`<span class="pill ${!state.connected?'neutral':''}">${state.connected?'Active':'Last seen active'}</span>`)}${settingRow('mic','Audio buffer','20 seconds before and 20 seconds after an alert.',`<span class="pill ${!state.connected?'neutral':''}">${state.connected?'Buffering':'Last known'}</span>`)}${settingRow('vibration','Acknowledgement feedback','A haptic pulse confirms a safety contact’s reply.',`<button class="button" data-action="haptic-test">Test</button>`)}</div></section></div>
 <div class="side-stack"><section class="panel panel-pad"><div class="panel-header"><h2>Battery & charging</h2>${icon('battery')}</div><div class="battery-visual"><span class="battery-big">${state.battery}%</span><div class="battery-description"><strong>${state.charging?'Charging via USB-C':state.battery<=20?'Time for a recharge':'A little power for your day'}</strong>${state.connected?'Current demo level':'Last known demo level'}</div></div><div class="battery-track"><span style="width:${state.battery}%"></span></div><div class="info-lines section-gap"><div class="info-line"><span>Charging method</span><strong>USB-C</strong></div><div class="info-line"><span>Battery-life design target</span><strong>12 hours</strong></div><div class="info-line"><span>Runtime estimate</span><strong>Not measured</strong></div></div><p class="audio-micro-note">The 12-hour target needs verification with the final battery and hardware.</p></section>
 <section class="panel panel-pad"><div class="panel-header"><h2>Before your next visit</h2>${icon('checkcircle')}</div><p class="small-description">Run a quick check of the demo connection, skin contact, motion sensing, and feedback.</p><button class="button primary full section-gap" data-action="device-check">Run device check ${icon('arrow')}</button></section></div></div>`;}
function eventCard(e){const t=TYPES[e.type]||TYPES.manual;return `<button class="panel event-card" data-action="event" data-id="${esc(e.id)}"><span class="row-symbol ${['manual','removal'].includes(e.type)?'alert':''}">${icon(t.icon)}</span><span class="row-main"><span class="row-title">${esc(t.title)}</span><span class="row-subtitle" style="display:block">${e.status==='acknowledged'?esc(e.ackBy)+' replied':e.hapticPending?'Feedback waiting for reconnection':'Your safety contacts have not replied yet'}</span></span><span class="event-meta">${statusPill(e)}<span class="row-time">${date(e.created)} · ${time(e.created)}</span></span><span class="event-chevron">${icon('chevron')}</span></button>`;}
function alertsPage(){let events=[...state.events].sort((a,b)=>b.created-a.created);if(filter==='pending')events=events.filter(e=>e.status==='awaiting');if(filter==='acknowledged')events=events.filter(e=>e.status==='acknowledged');return header('A clear picture of every alert.','Follow an event from your wrist to a safety contact’s reply.','ALERT HISTORY')+notices()+`
 <div class="alerts-toolbar"><div class="tabs" role="tablist" aria-label="Filter alerts">${[['all','All events'],['pending','Awaiting reply'],['acknowledged','Acknowledged']].map(([id,n])=>`<button class="tab ${filter===id?'active':''}" role="tab" aria-selected="${filter===id}" data-action="filter" data-key="${id}">${n}</button>`).join('')}</div><button class="button" data-action="send-alert">${icon('plus')} New alert</button></div>
 ${!state.connected?'<div class="queue-callout" style="margin-bottom:20px">New events created on the wearable while disconnected are not visible on this phone yet. Reconnect to retrieve them. Audio uploads already known to this app will resume too.</div>':''}
 <div class="event-list">${events.map(eventCard).join('')||`<section class="panel empty-state">${icon('checkcircle')}<h2>${filter==='pending'?'No replies to wait for.':'Nothing here yet.'}</h2><p>${filter==='pending'?'Your visible alerts are acknowledged.':'Events matching this view will appear here.'}</p></section>`}</div><p class="event-demo-label">${icon('info')} All events in this prototype are simulated. No messages are sent.</p>`;}
function contactsPage(){return header('Your people, within reach.','Choose the people who receive your wearable alerts.','SAFETY CONTACTS')+`<div class="contacts-intro">Your primary and backup contacts make up your safety circle. Contact details stay in this browser in the prototype; there is no delivery service connected.</div><div class="panel-header"><h2>${state.contacts.length} safety contact${state.contacts.length===1?'':'s'}</h2><button class="button primary" data-action="add-contact">${icon('plus')} Add contact</button></div><div class="contact-grid">${state.contacts.map((c,i)=>`<section class="panel contact-profile"><div class="contact-profile-top"><div class="avatar ${i%2?'rose':''}">${esc(initials(c.name))}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.role)}</p></div></div><div class="contact-details"><div>${icon('phone')} ${esc(c.phone)}</div><div>${icon('mail')} ${esc(c.email||'No email added')}</div></div><div class="contact-profile-bottom"><span class="pill ${i?'neutral':''}">${i===0?'Primary contact':'Backup contact'}</span><div style="display:flex;gap:15px"><button class="text-link" data-action="edit-contact" data-id="${esc(c.id)}">Edit ${icon('edit')}</button><button class="text-link danger-link" data-action="delete-contact" data-id="${esc(c.id)}" aria-label="Remove ${esc(c.name)}">${icon('trash')}</button></div></div></section>`).join('')||`<section class="panel empty-state" style="grid-column:1/-1">${icon('users')}<h2>Start with someone you trust.</h2><p>Add a primary safety contact to set up your circle.</p><button class="button primary" data-action="add-contact">Add your first contact</button></section>`}</div><section class="notification-card panel section-gap"><h2>What does a contact receive?</h2><p>The proposed alert includes your name, event type, time, and the audio around the event. Acknowledgements are shown separately from delivery, so you can tell whether someone has replied.</p></section>`;}
function settingsPage(){return header('Make it feel like yours.','A few details that help your team stay connected.','SETTINGS')+`<div class="wide-grid"><div class="main-stack"><section class="panel profile-panel"><div class="profile-head"><div class="avatar">${esc(initials(state.profile.name))}</div><div><h2>Your responder profile</h2><p>Included with a proposed alert notification.</p></div></div><form id="profile-form"><label class="form-field">Full name<input name="name" autocomplete="name" required maxlength="70" value="${esc(state.profile.name)}"></label><div class="form-grid"><label class="form-field">Role<input name="role" maxlength="70" required value="${esc(state.profile.role)}"></label><label class="form-field">Team / organization<input name="organization" maxlength="90" value="${esc(state.profile.organization)}"></label></div><button class="button primary" type="submit">Save profile ${icon('check')}</button></form></section>
 <section class="panel"><div class="settings-heading"><h2>Notifications & display</h2></div><div class="settings-list">${settingRow('bluetooth','Connection notices','Show a toast when the wearable disconnects.',switchButton('disconnectNotice','Connection notices',state.settings.disconnectNotice))}${settingRow('contact','Skin-contact notices','Show a toast when simulated skin contact is lost.',switchButton('contactNotice','Skin-contact notices',state.settings.contactNotice))}${settingRow('moon','Reduce motion','Keep screen transitions and progress effects still.',switchButton('reducedMotion','Reduce motion',state.settings.reducedMotion))}</div></section></div>
 <div class="side-stack"><section class="panel panel-pad"><div class="panel-header"><h2>A reply you can feel.</h2>${icon('vibration')}</div><p class="small-description">The wearable gives haptic feedback after a safety contact acknowledges your alert.</p><label class="form-field section-gap">Demo acknowledgement pattern<select id="haptic-pattern"><option ${state.settings.hapticPattern==='Two short pulses'?'selected':''}>Two short pulses</option><option ${state.settings.hapticPattern==='One long pulse'?'selected':''}>One long pulse</option></select></label><button class="button full" data-action="haptic-test">Preview haptic pattern ${icon('vibration')}</button></section>
 <section class="panel panel-pad"><div class="panel-header"><h2>About this prototype</h2>${icon('info')}</div><p class="small-description">A wearer-facing design for the CCEW capstone. Device data, contact messages, recordings, and acknowledgements are simulated.</p><div class="info-lines section-gap"><div class="info-line"><span>Form factor</span><strong>Wrist-worn</strong></div><div class="info-line"><span>Charging</span><strong>USB-C</strong></div><div class="info-line"><span>Removal sensing</span><strong>Skin contact</strong></div></div><button class="button full section-gap" data-action="demo-controls">Open demo controls ${icon('sliders')}</button></section></div></div>`;}

function showModal(content){stopPlayback();modal.innerHTML=`<button class="modal-close" data-action="close-modal" aria-label="Close dialog">${icon('x')}</button>${content}`;if(!modal.open)modal.showModal();syncActiveAudio();}
function closeModal(){stopPlayback();if(modal.open)modal.close();activeEvent=null;}
modal.addEventListener('close',()=>{if(!modal.open){stopPlayback();activeEvent=null;}});
function alertModal(){showModal(`<div class="modal-hero-icon">${icon('alert')}</div><p class="demo-label">DEMO ALERT</p><h2 id="modal-title" class="modal-title">A little support is a tap away.</h2><p class="modal-lead">${state.connected?'This simulates pressing your wearable’s alarm button. Your safety circle receives a simulated alert, and a 20-second post-event audio window begins.':'The wearable is disconnected. This will create an event on the simulated wearable; it becomes visible on the phone after reconnection.'}</p><div class="queue-callout">This prototype sends no messages and does not contact emergency services.</div><div style="margin-top:18px">${contactSummary()}</div><div class="modal-actions"><button class="button" data-action="close-modal">Go back</button>${state.contacts.length?'<button class="button danger" data-action="confirm-alert">Create demo alert</button>':'<button class="button primary" data-action="go-contacts">Add a contact first</button>'}</div>`);}
function createEvent(type='manual'){
 const now=Date.now();const e={id:`event-${now}-${Math.random().toString(36).slice(2,7)}`,type,created:now,status:'awaiting',received:state.connected?now:null,acknowledged:null,ackBy:null,audioReadyAt:now+20000,audioSynced:false,hapticPending:false};
 if(state.connected)state.events.unshift(e);else state.deviceOutbox.push(e);
 save();render();return e;
}
function reconnect(){const amount=state.deviceOutbox.length;state.connected=true;state.lastSync=Date.now();for(const e of state.deviceOutbox){e.received=Date.now();state.events.unshift(e);}state.deviceOutbox=[];let feedback=false;for(const e of state.events){if(Date.now()>=e.audioReadyAt)e.audioSynced=true;if(e.hapticPending){e.hapticPending=false;feedback=true;}}save();closeModal();render();toast(amount?`${amount} queued demo event${amount===1?'':'s'} synced from the wearable.`:feedback?'Reconnected. Pending demo haptic feedback delivered.':'Demo wearable reconnected.');}
function acknowledge(id){const e=state.events.find(x=>x.id===id);if(!e||e.status!=='awaiting')return;e.status='acknowledged';e.acknowledged=Date.now();e.ackBy=state.contacts[0]?.name||'Demo safety contact';e.hapticPending=!state.connected;save();render();toast(state.connected?'Demo reply received. Wrist feedback: '+state.settings.hapticPattern.toLowerCase()+'.':'Demo reply received. Wrist feedback waits for reconnection.');if(modal.open&&activeEvent===id)eventModal(id);else closeModal();}
function demoModal(){showModal(`<p class="demo-label">INTERACTIVE PROTOTYPE</p><h2 id="modal-title" class="modal-title">Try the moments that matter.</h2><p class="modal-lead">Change the simulated wearable state. These controls test the UI without connecting hardware or sending messages.</p>
 <div class="demo-option"><div><h3>Bluetooth connection</h3><p>${state.connected?'Connected to the demo phone':'Disconnected · phone shows last-known data'}</p></div><button class="switch" role="switch" aria-label="Demo Bluetooth connection" aria-checked="${state.connected}" data-action="demo-connection"></button></div>
 <div class="demo-option"><div><h3>Skin contact</h3><p>${state.worn?'On wrist · contact detected':'Off wrist · a removal event is created'}</p></div><button class="switch" role="switch" aria-label="Demo skin contact" aria-checked="${state.worn}" data-action="demo-contact"></button></div>
 <div class="demo-option"><div><h3>Low battery</h3><p>Preview a 14% battery warning.</p></div><button class="switch" role="switch" aria-label="Demo low battery" aria-checked="${state.battery<=20}" data-action="demo-battery"></button></div>
 <div class="demo-option"><div><h3>USB-C charging</h3><p>${state.charging?'Charging cable connected':'Charging cable disconnected'}</p></div><button class="switch" role="switch" aria-label="Demo USB-C charging" aria-checked="${state.charging}" data-action="demo-charging"></button></div>
 <div class="demo-option"><div><h3>Wearable alarm button</h3><p>${state.connected?'Creates an alert on the phone':'Stored on the wearable until it reconnects'}</p></div><button class="button" data-action="simulate-alarm">Press button</button></div>
 <div class="demo-option"><div><h3>Possible fall</h3><p>Try a 10-second check-in before an alert.</p></div><button class="button" data-action="simulate-fall" ${state.fallDue?'disabled':''}>Simulate fall</button></div>
 <div class="demo-option"><div><h3>Safety contact reply</h3><p>Acknowledges the newest visible pending alert.</p></div><button class="button" data-action="ack-latest" ${!pendingCount()?'disabled':''}>Acknowledge</button></div>
 <div class="queue-callout">Simulator only: ${state.deviceOutbox.length} event${state.deviceOutbox.length===1?'':'s'} stored on the wearable. This count is deliberately hidden from the phone while Bluetooth is disconnected.</div>
 <div class="modal-actions"><button class="button ghost" data-action="reset-demo">Reset demo data</button><button class="button primary" data-action="close-modal">Done</button></div>`);}
function eventModal(id){const e=state.events.find(x=>x.id===id);if(!e)return;activeEvent=id;const t=TYPES[e.type]||TYPES.manual;const ready=Date.now()>=e.audioReadyAt;showModal(`<p class="demo-label">SIMULATED EVENT · ${date(e.created)} AT ${time(e.created)}</p><h2 id="modal-title" class="modal-title">${esc(t.title)}</h2>${statusPill(e)}<ol class="timeline"><li><span class="timeline-dot"></span><div><strong>Event captured on wearable</strong><p>${time(e.created)} · ${esc(t.short)}</p></div></li><li><span class="timeline-dot"></span><div><strong>Phone received the event</strong><p>${time(e.received||e.created)} · Metadata received in this demo</p></div></li><li><span class="timeline-dot ${e.status!=='acknowledged'?'waiting':''}"></span><div><strong>${e.status==='acknowledged'?'Safety contact acknowledged':'Waiting for a safety contact’s reply'}</strong><p>${e.status==='acknowledged'?esc(e.ackBy)+' · '+time(e.acknowledged):'Delivery and acknowledgement are separate states.'}</p></div></li>${e.status==='acknowledged'?`<li><span class="timeline-dot ${e.hapticPending?'waiting':''}"></span><div><strong>${e.hapticPending?'Wrist feedback pending':'Haptic feedback acknowledged'}</strong><p>${e.hapticPending?'Will be delivered when the wearable reconnects.':esc(state.settings.hapticPattern)+' · simulated'}</p></div></li>`:''}</ol>
 <div class="audio-block"><div class="audio-summary"><strong>Event audio</strong><span data-audio-status>${ready?(state.connected?'Ready · 40s':'Upload queued · 40s'):'Capturing post-event audio'}</span></div>${wave()}<div class="wave-labels" style="color:#9aa98c"><span>−20s</span><span>ALERT</span><span>+20s</span></div><div class="audio-controls section-gap"><button class="play-button" data-action="play-audio" aria-label="Play synthetic audio sample" ${!ready?'disabled':''}>${icon('play')}</button><input class="audio-range" id="audio-seek" aria-label="Seek in synthetic audio" type="range" min="0" max="40" value="0" step=".1" ${!ready?'disabled':''}><span class="audio-time" id="audio-time">0:00 / 0:40</span></div><p class="playback-state" id="playback-state">${ready?'Synthetic sample audio for UI review.':`20s pre-event buffer saved. ${Math.max(0,Math.ceil((e.audioReadyAt-Date.now())/1000))}s of post-event capture remaining.`}</p></div><p class="audio-micro-note">No microphone is used. Playback and downloads contain a generated tone sample, not a real recording.</p>
 <div class="modal-actions"><button class="button" data-action="download-audio" ${!ready?'disabled':''}>${icon('download')} Demo audio</button>${e.status==='awaiting'?`<button class="button primary" data-action="ack-event" data-id="${esc(e.id)}">Simulate acknowledgement</button>`:'<button class="button primary" data-action="close-modal">Done</button>'}</div>`);activeEvent=id;}
function contactModal(id=null){
 const c=state.contacts.find(x=>x.id===id)||{id:'',name:'',role:'Safety representative',phone:'',email:''};
 const phonePattern=String.raw`[+0-9\(\) .\-]{7,30}`;
 showModal(`<p class="demo-label">YOUR SAFETY CIRCLE</p><h2 id="modal-title" class="modal-title">${id?'Edit safety contact.':'Add someone you trust.'}</h2><p class="modal-lead">Contact information is stored only in this browser for the prototype.</p>
 <form id="contact-form" data-id="${esc(c.id)}">
 <label class="form-field">Full name<input name="name" required maxlength="70" autocomplete="name" placeholder="e.g. Jordan Lee" value="${esc(c.name)}"></label>
 <label class="form-field">Relationship / role<input name="role" required maxlength="70" placeholder="e.g. Team supervisor" value="${esc(c.role)}"></label>
 <label class="form-field">Phone number<input name="phone" type="tel" required maxlength="30" pattern="${phonePattern}" autocomplete="tel" placeholder="(555) 010-0000" value="${esc(c.phone)}"></label>
 <label class="form-field">Email <span style="font-weight:400">(optional)</span><input name="email" type="email" maxlength="120" autocomplete="email" placeholder="name@example.com" value="${esc(c.email)}"></label>
 <div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">Save contact ${icon('check')}</button></div></form>`);
}
function deviceCheck(){const results=[['bluetooth','Bluetooth',state.connected,'Connected','Out of range'],['contact','Skin contact',state.connected&&state.worn,'Contact detected',state.connected?'Adjust the strap':'Unknown while disconnected'],['activity','Motion sensing',state.connected,'Demo sensor active','Last known status only'],['vibration','Feedback path',state.connected,'Demo haptic ready','Requires reconnection']];showModal(`<p class="demo-label">QUICK DEVICE CHECK</p><h2 id="modal-title" class="modal-title">A moment to check in.</h2><p class="modal-lead">A simulated check of the four essentials before your next visit.</p><div class="progress-track"><div class="progress-fill"></div></div><div class="check-grid">${results.map(([i,n,ok,yes,no])=>`<div class="check-item ${!ok?'fail':''}">${icon(i)}<strong>${n}</strong><p>${ok?yes:no}</p></div>`).join('')}</div><div class="check-results">${results.every(x=>x[2])?'The demo connection and contact checks passed.':'There’s something to check. Review the highlighted items before relying on the device.'} This UI check does not test real hardware.</div><div class="modal-actions"><button class="button primary" data-action="close-modal">Done ${icon('check')}</button></div>`);}
function hapticTest(){if(!state.connected){toast('Reconnect the demo wearable to preview feedback.',true);return;}showModal(`<div class="modal-hero-icon" style="background:#eef4e5;border-color:#e0e9d4;color:#789267">${icon('vibration')}</div><p class="demo-label">HAPTIC PREVIEW</p><h2 id="modal-title" class="modal-title">A quiet signal.<br>A clear reply.</h2><p class="modal-lead">${esc(state.settings.hapticPattern)} represents a safety contact acknowledging your alert. This prototype shows the pattern visually; it does not vibrate your wearable or phone.</p><div class="check-results" style="display:flex;justify-content:center;gap:18px;padding:30px">${state.settings.hapticPattern==='Two short pulses'?'<span style="width:45px;height:12px;border-radius:8px;background:#7e9c68"></span><span style="width:45px;height:12px;border-radius:8px;background:#7e9c68"></span>':'<span style="width:125px;height:12px;border-radius:8px;background:#7e9c68"></span>'}</div><div class="modal-actions"><button class="button primary" data-action="close-modal">Got it</button></div>`);}

function syncActiveAudio(){
 if(!modal.open||!activeEvent)return;
 const e=state.events.find(x=>x.id===activeEvent);if(!e)return;
 const remaining=Math.max(0,Math.ceil((e.audioReadyAt-Date.now())/1000));
 const status=modal.querySelector('[data-audio-status]'),p=modal.querySelector('#playback-state');
 if(status)status.textContent=remaining?'Capturing post-event audio':e.audioSynced?'Ready · 40s':'Upload queued · 40s';
 modal.querySelectorAll('[data-action="play-audio"],[data-action="download-audio"],#audio-seek').forEach(b=>b.disabled=Boolean(remaining)||!e.audioSynced);
 if(p&&!playingAudio)p.textContent=remaining?`20s pre-event buffer saved. ${remaining}s of post-event capture remaining.`:e.audioSynced?'Synthetic sample audio for UI review.':'Audio is queued on the wearable until reconnection.';
}

function makeSampleURL(){if(audioURL)return audioURL;const rate=16000,seconds=40,n=rate*seconds;const buffer=new ArrayBuffer(44+n*2),dv=new DataView(buffer);const text=(offset,s)=>[...s].forEach((c,i)=>dv.setUint8(offset+i,c.charCodeAt(0)));text(0,'RIFF');dv.setUint32(4,36+n*2,true);text(8,'WAVE');text(12,'fmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,rate,true);dv.setUint32(28,rate*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);text(36,'data');dv.setUint32(40,n*2,true);for(let i=0;i<n;i++){const t=i/rate,p=t%4;let v=p<.22?Math.sin(2*Math.PI*(t<20?330:440)*t)*.07*Math.sin(Math.PI*p/.22):0;dv.setInt16(44+i*2,Math.round(v*32767),true);}audioURL=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));return audioURL;}
function stopPlayback(){if(playingAudio){const audio=playingAudio;playingAudio=null;audio.ontimeupdate=null;audio.onended=null;audio.onpause=null;audio.onplay=null;audio.pause();}}
function playAudio(){if(playingAudio){if(playingAudio.paused){playingAudio.play().catch(()=>toast('Your browser could not play the sample.',true));}else playingAudio.pause();syncPlayButton();return;}
 playingAudio=new Audio(makeSampleURL());playingAudio.ontimeupdate=()=>{const input=document.querySelector('#audio-seek'),label=document.querySelector('#audio-time');if(input)input.value=playingAudio.currentTime;if(label)label.textContent=`${formatDuration(playingAudio.currentTime)} / 0:40`;};playingAudio.onended=()=>{syncPlayButton();const p=document.querySelector('#playback-state');if(p)p.textContent='Synthetic sample finished. Press play to replay.';};playingAudio.onpause=syncPlayButton;playingAudio.onplay=syncPlayButton;const input=document.querySelector('#audio-seek');if(input)playingAudio.currentTime=Number(input.value);playingAudio.play().then(()=>{const p=document.querySelector('#playback-state');if(p)p.textContent='Playing a synthetic tone sample. No real recording.';}).catch(()=>toast('Audio playback is unavailable in this browser.',true));}
function syncPlayButton(){const b=document.querySelector('[data-action="play-audio"]');if(b){b.innerHTML=icon(playingAudio&&!playingAudio.paused?'pause':'play');b.setAttribute('aria-label',playingAudio&&!playingAudio.paused?'Pause synthetic audio sample':'Play synthetic audio sample');}}
const formatDuration=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

document.addEventListener('click',event=>{
 const target=event.target.closest('[data-action],[data-view]');if(!target||target.disabled)return;
 if(target.dataset.view){event.preventDefault();navTo(target.dataset.view);return;}
 const action=target.dataset.action,id=target.dataset.id;event.preventDefault();
 switch(action){
  case 'close-modal':closeModal();break;
  case 'send-alert':alertModal();break;
  case 'confirm-alert':case 'simulate-alarm':{const e=createEvent();closeModal();if(state.connected){navTo('alerts');toast('Demo alert received by phone. Waiting for a contact’s reply.');eventModal(e.id);}else toast('Demo event saved on the wearable. Reconnect to sync it.');break;}
  case 'event':eventModal(id);break;
  case 'filter':filter=target.dataset.key;render();break;
  case 'demo-controls':demoModal();break;
  case 'demo-connection':if(!state.connected){reconnect();demoModal();}else{state.connected=false;state.lastSync=Date.now();save();render();demoModal();if(state.settings.disconnectNotice)toast('Demo Bluetooth disconnected. Status is now last known.');}break;
  case 'reconnect':reconnect();break;
  case 'demo-contact':state.worn=!state.worn;if(!state.worn)createEvent('removal');save();render();demoModal();if(!state.worn&&state.settings.contactNotice)toast(state.connected?'Skin contact lost. Demo removal alert created.':'Demo wearable removed. Event will sync after reconnection.');break;
  case 'demo-battery':state.battery=state.battery<=20?84:14;save();render();demoModal();break;
  case 'demo-charging':state.charging=!state.charging;save();render();demoModal();break;
  case 'simulate-fall':state.fallDue=Date.now()+10000;save();closeModal();render();toast('Possible demo fall. You have 10 seconds to tap “I’m okay.”');break;
  case 'cancel-fall':state.fallDue=null;save();render();toast('Fall check-in cancelled. No alert was created.');break;
  case 'ack-latest':{const latest=state.events.find(e=>e.status==='awaiting');if(latest)acknowledge(latest.id);break;}
  case 'ack-event':acknowledge(id);break;
  case 'device-check':deviceCheck();break;
  case 'haptic-test':hapticTest();break;
  case 'pairing-info':showModal(`<p class="demo-label">DEMO CONNECTION</p><h2 id="modal-title" class="modal-title">Paired and in sync.</h2><p class="modal-lead">CCEW-024 is the simulated wearable for this prototype. Use Demo controls to disconnect, create events out of range, and reconnect.</p><div class="queue-callout">This is a connection preview for design review. Pairing a real wearable will be added when the app is connected to the team’s hardware.</div><div class="modal-actions"><button class="button primary" data-action="close-modal">Done</button></div>`);break;
  case 'add-contact':contactModal();break;
  case 'edit-contact':contactModal(id);break;
  case 'delete-contact':{const c=state.contacts.find(x=>x.id===id);if(c)showModal(`<h2 id="modal-title" class="modal-title">Remove ${esc(c.name)}?</h2><p class="modal-lead">This removes the contact from this browser’s demo safety circle. Existing event history stays available.</p><div class="modal-actions"><button class="button" data-action="close-modal">Keep contact</button><button class="button danger" data-action="confirm-delete" data-id="${esc(id)}">Remove contact</button></div>`);break;}
  case 'confirm-delete':state.contacts=state.contacts.filter(c=>c.id!==id);save();closeModal();render();toast('Contact removed from this demo.');break;
  case 'go-contacts':closeModal();navTo('contacts');contactModal();break;
  case 'setting-toggle':{const key=target.dataset.key;if(!['disconnectNotice','contactNotice','reducedMotion'].includes(key))return;state.settings[key]=!state.settings[key];save();render();toast('Preference saved in this browser.');break;}
  case 'reset-demo':showModal(`<p class="demo-label">RESET PROTOTYPE</p><h2 id="modal-title" class="modal-title">Start with a clean slate?</h2><p class="modal-lead">Your locally added contacts, profile edits, and demo events will be replaced with the original sample data.</p><div class="modal-actions"><button class="button" data-action="demo-controls">Keep my changes</button><button class="button danger" data-action="confirm-reset">Reset demo</button></div>`);break;
  case 'confirm-reset':state=freshState();filter='all';save();closeModal();render();toast('Demo data reset.');break;
  case 'play-audio':playAudio();break;
  case 'download-audio':{const a=document.createElement('a');a.href=makeSampleURL();a.download='CCEW-synthetic-demo-audio-40s.wav';document.body.append(a);a.click();a.remove();toast('Downloaded a synthetic sample. It contains no real recording.');break;}
 }
});
document.addEventListener('submit',event=>{
 if(event.target.id==='profile-form'){event.preventDefault();const data=new FormData(event.target);const name=String(data.get('name')).trim(),role=String(data.get('role')).trim();if(!name||!role){toast('Enter a name and role.',true);return;}state.profile={name,role,organization:String(data.get('organization')).trim()};save();render();toast('Profile saved in this browser.');}
 if(event.target.id==='contact-form'){event.preventDefault();const data=new FormData(event.target),oldId=event.target.dataset.id;const c={id:oldId||`contact-${Date.now()}`,name:String(data.get('name')).trim(),role:String(data.get('role')).trim(),phone:String(data.get('phone')).trim(),email:String(data.get('email')).trim()};if(!c.name||!c.role||c.phone.replace(/\D/g,'').length<7){toast('Enter a name, role, and valid phone number.',true);return;}if(oldId)state.contacts=state.contacts.map(x=>x.id===oldId?c:x);else state.contacts.push(c);save();closeModal();render();toast('Safety contact saved in this browser.');}
});
document.addEventListener('change',event=>{if(event.target.id==='haptic-pattern'){state.settings.hapticPattern=event.target.value;save();toast('Demo haptic pattern saved.');}});
document.addEventListener('input',event=>{if(event.target.id==='audio-seek'){const n=Number(event.target.value);if(playingAudio)playingAudio.currentTime=n;const label=document.querySelector('#audio-time');if(label)label.textContent=`${formatDuration(n)} / 0:40`;}});
document.addEventListener('keydown',event=>{if(event.key.toLowerCase()==='d'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!modal.open){event.preventDefault();demoModal();}});
setInterval(()=>{
 let audioChanged=false;for(const e of state.events)if(state.connected&&Date.now()>=e.audioReadyAt&&!e.audioSynced){e.audioSynced=true;audioChanged=true;}if(audioChanged)save();
 if(state.fallDue){const left=Math.ceil((state.fallDue-Date.now())/1000);if(left<=0){state.fallDue=null;const e=createEvent('fall');save();render();toast(state.connected?'Demo fall alert received. Waiting for a contact’s reply.':'Demo fall event saved on wearable until reconnection.');}else document.querySelectorAll('[data-fall-count]').forEach(el=>el.textContent=left);}
 syncActiveAudio();
},250);
window.addEventListener('beforeunload',()=>{stopPlayback();if(audioURL)URL.revokeObjectURL(audioURL);});
hydrateIcons();render();
