const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load({ enabled = true, os = 'ios' } = {}) {
  const storage = new Map();
  let scheduled;
  const Notifications = {
    getPermissionsAsync: async () => ({ status: 'granted', ios: { status: 2, allowsSound: false, allowsAlert: true, allowsBadge: true } }),
    getPresentedNotificationsAsync: async () => [notification()],
    scheduleNotificationAsync: async request => { scheduled = request; return 'local-id'; },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  };
  const AsyncStorage = {
    getItem: async key => storage.get(key) || null,
    setItem: async (key, value) => storage.set(key, value),
    removeItem: async key => storage.delete(key),
  };
  const source = fs.readFileSync('src/services/pushDiagnostics.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/export /g, '');
  const context = { Notifications, AsyncStorage, Platform: { OS: os }, process: { env: { EXPO_PUBLIC_PUSH_DIAGNOSTICS: String(enabled) } } };
  vm.runInNewContext(source + '\nthis.api = { recordPushDiagnostic, getPushDiagnostics, clearPushDiagnostics, scheduleSoundDiagnostic };', context);
  return { ...context.api, storage, scheduled: () => scheduled };
}
function notification(sound = 'default') {
  return { date: 12345, request: { identifier: 'secret-id', content: { title: 'secret title', body: 'private message', sound, data: { token: 'secret-token' } }, trigger: { type: 'push', payload: { aps: { alert: { body: 'private message' }, sound }, userId: 'private-user' } } } };
}
test('diagnostics are opt-in and iOS only', async () => {
  for (const opts of [{ enabled: false }, { os: 'android' }]) {
    const s = load(opts); await s.recordPushDiagnostic(notification());
    assert.equal(await s.getPushDiagnostics(), null);
    await s.scheduleSoundDiagnostic(); assert.equal(s.scheduled(), undefined);
    assert.equal(s.storage.size, 0);
  }
});
test('report preserves denied sound permission and sanitizes push metadata', async () => {
  const s = load(); await s.recordPushDiagnostic(notification(), 'received');
  const report = await s.getPushDiagnostics();
  assert.equal(report.allowsSound, false);
  assert.equal(report.captured[0].sound, 'default');
  assert.equal(report.captured[0].nativeSound, 'default');
  assert.equal(report.presented[0].apsSoundPresent, true);
  assert.doesNotMatch(JSON.stringify(report), /secret|private message|private-user/);
});
test('concurrent events are retained in a bounded log and clear removes them', async () => {
  const s = load(); await Promise.all(Array.from({ length: 30 }, () => s.recordPushDiagnostic(notification())));
  assert.equal((await s.getPushDiagnostics()).captured.length, 20);
  await s.clearPushDiagnostics(); assert.equal((await s.getPushDiagnostics()).captured.length, 0);
});
test('timed comparison uses native default sound and does not modify badges', async () => {
  const s = load(); await s.scheduleSoundDiagnostic(); const req = s.scheduled();
  assert.equal(req.content.sound, 'default'); assert.equal(req.trigger.seconds, 10);
  assert.equal(req.trigger.repeats, false); assert.equal(req.content.badge, undefined);
});
test('diagnostic iPhone chime never touches the custom audio session', async () => {
  const source = fs.readFileSync('src/utils/notificationSound.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
  const context = { PUSH_DIAGNOSTICS: true, Audio: new Proxy({}, { get() { assert.fail('custom audio accessed'); } }) };
  vm.runInNewContext(source + '\nthis.play = playNotificationSound;', context);
  await context.play();
});
