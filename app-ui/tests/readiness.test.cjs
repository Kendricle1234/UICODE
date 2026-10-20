const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  fs.rmSync(path.resolve(__dirname,'readiness-results.json'),{force:true});
  const browser = await chromium.launch({ executablePath: process.env.CCEW_BROWSER_PATH || '/usr/bin/chromium', headless:true });
  const standalone = http.createServer((req,res) => { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}); res.end(fs.readFileSync(path.resolve(__dirname,'../CCEW_Companion.html'))); });
  await new Promise(resolve => standalone.listen(0,'127.0.0.1',resolve));
  const results = [];
  try {
    for (const [target,url] of [['development server',process.env.CCEW_UI_URL || 'http://127.0.0.1:4173'],['standalone over HTTP',`http://127.0.0.1:${standalone.address().port}`]]) {
      const context = await browser.newContext({viewport:{width:1440,height:1080},timezoneId:'America/Chicago',reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [], externalRequests = [];
      page.on('pageerror',e => errors.push(e.message));
      page.on('console',m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request',r => { if (/^https?:/.test(r.url()) && new URL(r.url()).hostname !== '127.0.0.1') externalRequests.push(r.url()); });
      await page.clock.install({time:new Date('2026-10-20T14:00:00Z')});
      await page.goto(url); await page.waitForSelector('.hero h2');
      const action = name => page.locator(`[data-action="${name}"]:visible`).first().click();
      const heading = async text => assert.equal(await page.locator('.hero h2').textContent(),text);
      const reset = () => page.evaluate(() => { const a = CCEWApp; a.audio.stop(); a.store.reset(); a.store.state.events = []; a.store.save(); a.navTo('overview'); });
      let combinations = 0;
      for (const connected of [true,false]) for (const worn of [true,false]) for (const battery of [0,14,20,21,84,100]) for (const charging of [false,true]) for (const fall of [false,true]) {
        const actual = await page.evaluate(v => {
          const a = CCEWApp; a.store.reset(); a.store.state.events = [];
          a.device.updateTelemetry({ worn:v.worn, rawWorn:v.worn, battery:v.battery, charging:v.charging });
          if (v.fall) a.demo.startFall();
          if (!v.connected) a.ble.disconnect();
          a.render();
          return { heading:document.querySelector('.hero h2').textContent, badge:document.querySelector('.hero .status-tag').className };
        },{connected,worn,battery,charging,fall});
        const expected = fall ? ['Are you okay?','urgent'] : !connected ? ['Let’s get you reconnected.','disconnected'] : !worn ? ['Check your wearable.','warning'] : battery <= 20 ? ['Time to recharge.','warning'] : ['Ready when you need it.','normal'];
        assert.equal(actual.heading,expected[0],JSON.stringify({connected,worn,battery,charging,fall}));
        assert.ok(actual.badge.includes(`readiness-${expected[1]}`)); combinations++;
      }
      await reset();
      assert.match(await page.locator('#main h1').textContent(),/^Good morning/);
      assert.deepEqual(await page.evaluate(() => [0,11,12,17,18,23].map(h => CCEWApp.greeting(new Date(2026,9,20,h)))),['Good morning','Good morning','Good afternoon','Good afternoon','Good evening','Good evening']);
      await page.clock.setSystemTime(new Date('2026-10-20T18:00:00Z')); await page.clock.runFor(250);
      assert.match(await page.locator('#main h1').textContent(),/^Good afternoon/);
      await page.clock.setSystemTime(new Date('2026-10-21T00:00:00Z')); await page.clock.runFor(250);
      assert.match(await page.locator('#main h1').textContent(),/^Good evening/);
      await page.clock.setSystemTime(new Date('2026-10-20T14:00:00Z')); await page.clock.runFor(250);
      // Phone confirmation rechecks the connection even if it drops after opening the dialog.
      await action('send-alert'); await page.evaluate(() => CCEWApp.ble.disconnect()); await action('confirm-alert');
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.length),0);
      assert.equal(await page.locator('[data-action="send-alert"]').isDisabled(),true);
      await reset(); await action('demo-controls'); await action('simulate-alarm'); await page.clock.runFor(250);
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events[0].transfer.status),'transferring');
      await action('demo-connection'); await page.clock.runFor(2000);
      assert.equal(await page.evaluate(() => CCEWApp.alerts.visible().length),0);
      await action('demo-connection'); await page.clock.runFor(4000);
      assert.equal(await page.evaluate(() => CCEWApp.alerts.visible().length),1);
      await reset(); await page.evaluate(() => CCEWApp.ble.disconnect());
      // Hardware-side events queue offline; reconnect progresses through visible connection states.
      await action('demo-controls');
      for (let i=0;i<3;i++) await action('simulate-alarm');
      assert.equal(await page.evaluate(() => CCEWApp.alerts.visible().length),0);
      assert.equal(await page.evaluate(() => CCEWApp.alerts.queued().length),3);
      await action('close-modal'); await action('reconnect'); await heading('Connecting your wearable.');
      await page.clock.runFor(1000); await heading('Getting back in sync.');
      await page.clock.runFor(3500);
      assert.equal(await page.evaluate(() => CCEWApp.alerts.visible().length),3);
      await action('demo-controls'); await action('replay-event');
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.length),3); await action('close-modal');
      // Audio transfer has persisted, unique chunks and remains playable after disconnect once complete.
      await action('send-alert'); await action('confirm-alert');
      const audioId = await page.evaluate(() => CCEWApp.alerts.visible()[0].id);
      await page.clock.runFor(21500);
      const partial = await page.evaluate(id => CCEWApp.alerts.get(id).audio.receivedChunks,audioId);
      assert.ok(partial.length > 0 && partial.length < 8);
      await page.evaluate(() => CCEWApp.ble.disconnect()); await page.clock.runFor(6000);
      assert.deepEqual(await page.evaluate(id => CCEWApp.alerts.get(id).audio.receivedChunks,audioId),partial);
      assert.equal(await page.locator('[data-action="play-audio"]').isDisabled(),true);
      await page.evaluate(() => CCEWApp.ble.connect()); await page.clock.runFor(8000);
      assert.deepEqual(await page.evaluate(id => CCEWApp.alerts.get(id).audio.receivedChunks,audioId),[0,1,2,3,4,5,6,7]);
      await page.evaluate(() => CCEWApp.ble.disconnect());
      assert.equal(await page.locator('[data-action="download-audio"]').isDisabled(),false);
      const [download] = await Promise.all([page.waitForEvent('download',{timeout:10000}), action('download-audio')]);
      const wav = fs.readFileSync(await download.path()); assert.equal(wav.toString('ascii',0,4),'RIFF'); assert.equal(wav.length,1280044);
      await action('play-audio'); await page.waitForFunction(() => CCEWApp.audio.player && !CCEWApp.audio.player.paused);
      // Selected reply while offline cannot claim that a haptic command completed.
      await page.locator('#ack-contact').selectOption('taylor'); await action('ack-event');
      assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).responder.name,audioId),'Taylor Brooks');
      assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).haptic.status,audioId),'pending');
      await page.evaluate(() => CCEWApp.ble.connect()); await page.clock.runFor(2000);
      assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).haptic.status,audioId),'sent');
      await action('fail-haptic'); assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).haptic.status,audioId),'failed');
      await action('retry-haptic'); await action('confirm-haptic');
      assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).haptic.status,audioId),'successful');
      await action('close-modal'); await page.evaluate(() => CCEWApp.navTo('overview'));
      // Sensor debounce is exercised through actual Demo controls.
      await action('demo-controls'); await action('brief-contact'); await page.clock.runFor(2500);
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.filter(e => e.type === 'removal').length),0);
      await action('demo-contact'); await page.clock.runFor(1750); await action('close-modal'); await heading('Check your wearable.');
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.filter(e => e.type === 'removal').length),1);
      await action('demo-controls'); await action('demo-contact'); await page.clock.runFor(1750); await action('close-modal');
      // Fall cancel, repeat, and interrupted-session timeout use persisted deadlines.
      const fallCount = await page.evaluate(() => CCEWApp.store.state.events.filter(e => e.type === 'fall').length);
      await action('demo-controls'); await action('simulate-fall'); await action('cancel-fall'); await page.clock.runFor(11000);
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.filter(e => e.type === 'fall').length),fallCount);
      await action('demo-controls'); await action('simulate-fall');
      const deadline = await page.evaluate(() => CCEWApp.store.state.fall.dueAt);
      await action('demo-controls'); await action('simulate-fall');
      assert.equal(await page.evaluate(() => CCEWApp.store.state.fall.dueAt),deadline);
      await action('demo-controls'); const reloaded = page.waitForEvent('load'); await action('interrupt-fall'); await reloaded;
      assert.equal(await page.evaluate(() => CCEWApp.store.state.fall.dueAt),deadline);
      await page.clock.runFor(11000);
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.filter(e => e.type === 'fall').length),fallCount + 1);
      // Refresh restores pending haptic state and partial audio without duplicating events.
      await reset(); await action('send-alert'); await action('confirm-alert'); await page.clock.runFor(21500);
      const restoredId = await page.evaluate(() => CCEWApp.alerts.visible()[0].id);
      await page.evaluate(() => CCEWApp.ble.disconnect()); await page.locator('#ack-contact').selectOption('taylor'); await action('ack-event');
      const beforeReload = await page.evaluate(id => CCEWApp.alerts.get(id).audio.receivedChunks,restoredId);
      await page.reload(); await page.waitForSelector('.event-list');
      assert.equal(await page.evaluate(id => CCEWApp.alerts.get(id).haptic.status,restoredId),'pending');
      assert.deepEqual(await page.evaluate(id => CCEWApp.alerts.get(id).audio.receivedChunks,restoredId),beforeReload);
      assert.equal(await page.evaluate(() => CCEWApp.store.state.events.length),1);
      // Low battery, skin contact, and disconnected states retain their priority.
      await reset(); await action('demo-controls'); await action('demo-battery'); await heading('Time to recharge.');
      await action('demo-charging'); await heading('Time to recharge.'); await action('demo-contact'); await page.clock.runFor(1750); await heading('Check your wearable.');
      await action('demo-connection'); await heading('Let’s get you reconnected.');
      await action('demo-battery');
      assert.equal(await page.evaluate(() => CCEWApp.device.getStatus().battery),14); await action('close-modal');
      // Component failures and target battery life are visible independently of the connection.
      await reset(); await action('demo-controls');
      await page.locator('[data-action="component-failure"][data-key="motion"]').click(); await action('close-modal');
      await action('device-check'); assert.match(await page.locator('[data-component="motion"]').textContent(),/failed/);
      assert.match(await page.locator('[data-component="bluetooth"]').textContent(),/passed/); await action('close-modal');
      await page.evaluate(() => CCEWApp.navTo('device')); assert.match(await page.locator('#main').textContent(),/>12 hours/);
      // Contact management: promote, order backups, require explicit deletion, and preserve responder history.
      await reset(); await page.evaluate(() => CCEWApp.navTo('contacts')); await action('add-contact');
      await page.locator('[name="name"]').fill('Sam Nguyen'); await page.locator('[name="role"]').fill('Backup contact'); await page.locator('[name="phone"]').fill('(555) 010-0300');
      await page.locator('#contact-form button[type="submit"]').click();
      await page.locator('[data-action="primary-contact"][data-id="taylor"]').click();
      assert.equal(await page.evaluate(() => CCEWApp.store.state.contacts[0].id),'taylor');
      await page.locator('[data-action="move-contact"][data-id="jordan"][data-direction="1"]').click();
      assert.equal(await page.evaluate(() => CCEWApp.store.state.contacts[2].id),'jordan');
      await page.locator('[data-action="delete-contact"][data-id="taylor"]').click();
      assert.equal(await page.locator('[data-action="confirm-delete"]').isDisabled(),true);
      await page.locator('#delete-confirm').check(); await action('confirm-delete');
      assert.equal(await page.evaluate(() => CCEWApp.store.state.contacts.some(c => c.id === 'taylor')),false);
      // Combined event-type and acknowledgement filters, IDs and exact timestamps.
      await reset(); await page.evaluate(() => { CCEWApp.demo.pressButton(); CCEWApp.alerts.detect('fall'); CCEWApp.navTo('alerts'); }); await page.clock.runFor(3000);
      await page.locator('#type-filter').selectOption('fall'); assert.equal(await page.locator('.event-card').count(),1);
      assert.equal(await page.locator('.event-card time[datetime]').count(),1); assert.match(await page.locator('.event-card .event-id').textContent(),/^event-/);
      await page.locator('.event-card').click(); await page.locator('#ack-contact').selectOption('taylor'); await action('ack-event'); await action('close-modal');
      await page.locator('#status-filter').selectOption('pending'); assert.equal(await page.locator('.event-card').count(),0);
      await page.locator('#status-filter').selectOption('acknowledged'); assert.equal(await page.locator('.event-card').count(),1);
      // Every main screen and readiness state must fit mobile/tablet/desktop without hidden final content.
      await reset();
      for (const width of [1440,768,390,320]) {
        await page.setViewportSize({width,height:width === 1440 ? 1080 : 844});
        for (const screen of ['overview','device','alerts','contacts','settings']) {
          await page.evaluate(screen => CCEWApp.navTo(screen),screen);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`${target}: ${width}px ${screen} overflows`);
          if (width <= 760) {
            await page.evaluate(() => window.scrollTo(0,document.documentElement.scrollHeight));
            assert.equal(await page.evaluate(() => document.querySelector('#main').lastElementChild.getBoundingClientRect().bottom <= document.querySelector('#mobile-nav').getBoundingClientRect().top),true,`${screen} final content behind navigation`);
          }
        }
        await page.evaluate(() => CCEWApp.navTo('overview'));
        for (const scenario of ['normal','low-battery','contact-lost','disconnected','connecting','syncing']) {
          await page.evaluate(scenario => {
            const a = CCEWApp; a.store.reset(); a.store.state.events = [];
            if (scenario === 'low-battery') a.demo.setBattery(14);
            if (scenario === 'contact-lost') a.device.updateTelemetry({worn:false,rawWorn:false});
            if (['disconnected','connecting','syncing'].includes(scenario)) a.store.state.device.connection = scenario;
            a.render();
          },scenario);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`${width}px ${scenario} overflows`);
        }
      }
      await reset(); await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.resolve(__dirname,'readiness-mobile.png'),fullPage:true});
      await page.setViewportSize({width:1440,height:1080});
      await page.screenshot({path:path.resolve(__dirname,'readiness-desktop.png'),fullPage:true});
      assert.deepEqual(errors,[]); assert.deepEqual(externalRequests,[]);
      results.push({target,readinessCombinations:combinations,acceptanceScenarios:8,phoneActionGuard:'passed',deliveryAndHapticStates:'passed',fallCancelRepeatAndReload:'passed',contactManagement:'passed',historyFilters:'passed',syntheticAudioPlaybackAndDownload:'passed',componentFailures:'passed',greeting:'passed',responsiveWidths:[1440,768,390,320],runtimeErrors:errors,externalRequests});
      await context.close();
    }
  } finally { await new Promise(resolve => standalone.close(resolve)); await browser.close(); }
  fs.writeFileSync(path.resolve(__dirname,'readiness-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2) + '\n');
  console.log(JSON.stringify(results,null,2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
