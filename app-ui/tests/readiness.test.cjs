const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CCEW_BROWSER_PATH || '/usr/bin/chromium',
    headless: true
  });
  const results = [];
  // Test the exact standalone document over HTTP: this cloud browser blocks file URLs.
  const standaloneServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.resolve(__dirname, '../CCEW_Companion.html')));
  });
  await new Promise(resolve => standaloneServer.listen(0, '127.0.0.1', resolve));
  const standaloneURL = `http://127.0.0.1:${standaloneServer.address().port}`;
  try {
    for (const url of [
      process.env.CCEW_UI_URL || 'http://127.0.0.1:4173',
      standaloneURL
    ]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.clock.install();
      await page.goto(url);
      await page.waitForSelector('.hero h2');
      let combinations = 0;
      for (const connected of [true, false]) {
        for (const worn of [true, false]) {
          for (const battery of [0, 14, 20, 21, 84, 100]) {
            for (const charging of [false, true]) {
              for (const fall of [false, true]) {
                const actual = await page.evaluate(values => {
                  Object.assign(state, values, { fallDue: values.fall ? Date.now() + 10000 : null });
                  render();
                  return {
                    heading: document.querySelector('.hero h2').textContent,
                    badge: document.querySelector('.hero .status-tag').textContent,
                    className: document.querySelector('.hero .status-tag').className,
                    description: document.querySelector('.hero-copy p').textContent,
                    batteryDetail: document.querySelector('.metric-detail').textContent,
                    contact: document.querySelectorAll('.metric-value')[1].textContent
                  };
                }, { connected, worn, battery, charging, fall });
                const expected = fall ? ['Are you okay?', 'urgent', 'FALL CHECK-IN']
                  : !connected ? ['Let’s get you reconnected.', 'disconnected', 'CONNECTION LOST']
                  : !worn ? ['Check your wearable.', 'warning', 'SKIN CONTACT LOST']
                  : battery <= 20 ? ['Time to recharge.', 'warning', 'LOW BATTERY']
                  : ['Ready when you need it.', 'normal', 'WEARABLE CONNECTED'];
                assert.equal(actual.heading, expected[0], JSON.stringify({ connected, worn, battery, charging, fall }));
                assert.ok(actual.className.includes(`readiness-${expected[1]}`));
                assert.equal(actual.badge, expected[2]);
                if (!connected) {
                  assert.match(actual.description, /last known/);
                  assert.equal(actual.batteryDetail, 'Last known level');
                  assert.equal(actual.contact, 'Unknown');
                }
                combinations++;
              }
            }
          }
        }
      }
      await page.evaluate(() => { state = freshState(); render(); });
      const action = name => page.locator(`[data-action="${name}"]:visible`).first().click();
      const heading = async text => assert.equal(await page.locator('.hero h2').textContent(), text);
      await action('demo-controls');
      await action('demo-battery');
      await heading('Time to recharge.');
      await action('demo-contact');
      await heading('Check your wearable.');
      await action('demo-connection');
      await heading('Let’s get you reconnected.');
      await action('simulate-fall');
      await heading('Are you okay?');
      const queuedBefore = await page.evaluate(() => state.deviceOutbox.length);
      await action('cancel-fall');
      await heading('Let’s get you reconnected.');
      assert.equal(await page.evaluate(() => state.deviceOutbox.length), queuedBefore);
      await action('demo-controls');
      await action('demo-connection');
      await action('simulate-fall');
      await heading('Are you okay?');
      await page.clock.runFor(10250);
      await heading('Check your wearable.');
      assert.equal(await page.evaluate(() => state.fallDue), null);
      assert.equal(await page.evaluate(() => state.events[0].type), 'fall');
      await action('demo-controls');
      await action('reset-demo');
      await action('confirm-reset');
      await heading('Ready when you need it.');
      for (const view of ['device', 'alerts', 'contacts', 'settings', 'overview']) {
        await page.evaluate(view => navTo(view), view);
        assert.ok(await page.locator('#main h1').textContent());
      }
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1080 : 844 });
        for (const scenario of ['normal', 'warning', 'disconnected', 'urgent']) {
          await page.evaluate(scenario => {
            state = freshState();
            if (scenario === 'warning') state.worn = false;
            if (scenario === 'disconnected') state.connected = false;
            if (scenario === 'urgent') state.fallDue = Date.now() + 10000;
            render();
          }, scenario);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px ${scenario} overflows`);
        }
      }
      await page.evaluate(() => { state = freshState(); render(); });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: path.resolve(__dirname, 'readiness-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1080 });
      await page.screenshot({ path: path.resolve(__dirname, 'readiness-desktop.png'), fullPage: true });
      assert.deepEqual(errors, []);
      results.push({ target: url === standaloneURL ? 'standalone over HTTP' : 'development server', combinations, demoControls: 'passed', fallCancelAndTimeout: 'passed', navigation: 'passed', responsiveWidths: [1440, 390, 320], runtimeErrors: errors });
      await context.close();
    }
  } finally {
    await new Promise(resolve => standaloneServer.close(resolve));
    await browser.close();
  }
  fs.writeFileSync(path.resolve(__dirname, 'readiness-results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
