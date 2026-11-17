import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const code = await fs.readFile(path.join(root, 'site/assets/app.js'), 'utf8');
const results = [];

function createEnvironment({ dark = true, theme = null, denied = false, gsap = false } = {}) {
  const events = new Map();
  const storage = new Map(theme ? [['olan-theme', theme]] : []);
  const toggleEvents = new Map();
  const meta = { content: theme || 'light dark' };
  const toggle = {
    hidden: true, dataset: {}, attributes: new Map(),
    addEventListener: (name, callback) => toggleEvents.set(name, callback),
    setAttribute(name, value) { this.attributes.set(name, value); },
    getAttribute(name) { return this.attributes.get(name); },
  };
  let mediaChange;
  const system = { matches: dark, addEventListener: (name, callback) => { if (name === 'change') mediaChange = callback; } };
  const motionCalls = [];
  const animation = {
    registerPlugin() {},
    matchMedia: () => ({ add: (query, callback) => motionCalls.push(query) }),
  };
  const window = {
    matchMedia: () => system,
    addEventListener: (name, callback) => events.set(name, callback),
    ...(gsap ? { gsap: animation, ScrollTrigger: {} } : {}),
  };
  const context = {
    window, gsap: animation, ScrollTrigger: {},
    document: {
      querySelector(selector) { return selector.startsWith('meta') ? meta : selector === '.theme-toggle' ? toggle : null; },
      querySelectorAll() { return []; },
    },
    localStorage: {
      getItem(key) { if (denied) throw new Error('Storage denied'); return storage.get(key) || null; },
      setItem(key, value) { if (denied) throw new Error('Storage denied'); storage.set(key, value); },
      removeItem(key) { if (denied) throw new Error('Storage denied'); storage.delete(key); },
    },
  };
  vm.runInNewContext(code, context, { timeout: 1000 });
  return { meta, toggle, storage, motionCalls,
    click: () => toggleEvents.get('click')(),
    changeOS(value) { system.matches = value; mediaChange(); },
    storageEvent(value) { if (value) storage.set('olan-theme', value); else storage.delete('olan-theme'); events.get('storage')({ key: 'olan-theme' }); },
  };
}

function test(name, callback) {
  try { callback(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

test('系统深色默认，主题控制可使用', () => {
  const environment = createEnvironment();
  assert.equal(environment.meta.content, 'light dark');
  assert.equal(environment.toggle.hidden, false);
  assert.equal(environment.toggle.dataset.renderedTheme, 'dark');
});
test('浅色覆盖持久化，切回系统深色删除覆盖', () => {
  const environment = createEnvironment();
  environment.click();
  assert.equal(environment.meta.content, 'light');
  assert.equal(environment.storage.get('olan-theme'), 'light');
  environment.click();
  assert.equal(environment.meta.content, 'light dark');
  assert.equal(environment.storage.has('olan-theme'), false);
});
test('系统改变不会清除已固定的配色', () => {
  const environment = createEnvironment({ dark: false, theme: 'dark' });
  environment.changeOS(true);
  environment.changeOS(false);
  assert.equal(environment.meta.content, 'dark');
  assert.equal(environment.storage.get('olan-theme'), 'dark');
  assert.equal(environment.toggle.dataset.renderedTheme, 'dark');
});
test('无覆盖时跟随系统配色变化', () => {
  const environment = createEnvironment({ dark: false });
  environment.changeOS(true);
  assert.equal(environment.toggle.dataset.renderedTheme, 'dark');
  assert.equal(environment.meta.content, 'light dark');
});
test('跨标签页 storage 同步及清除', () => {
  const environment = createEnvironment();
  environment.storageEvent('light');
  assert.equal(environment.meta.content, 'light');
  environment.storageEvent(null);
  assert.equal(environment.meta.content, 'light dark');
});
test('存储被拒绝也能切换当前页面', () => {
  const environment = createEnvironment({ denied: true });
  environment.click();
  assert.equal(environment.meta.content, 'light');
  assert.equal(environment.toggle.dataset.renderedTheme, 'light');
  environment.click();
  assert.equal(environment.meta.content, 'light dark');
});
test('缺少 GSAP 也不阻断页面交互', () => {
  const environment = createEnvironment({ gsap: false });
  environment.click();
  assert.equal(environment.meta.content, 'light');
  assert.deepEqual(environment.motionCalls, []);
});
test('空间动效只登记 no-preference 条件', () => {
  const environment = createEnvironment({ gsap: true });
  assert.deepEqual(environment.motionCalls, ['(prefers-reduced-motion: no-preference)']);
});

const report = { scope: 'Node VM unit-level checks, not real browser reduced-motion emulation', total: results.length, passed: results.filter((item) => item.passed).length, results };
await fs.writeFile(path.join(root, 'frontend-test-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;
