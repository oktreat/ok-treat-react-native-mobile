const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function load({ os = 'android', status = 'undetermined', granted = true, auth = 'session', token = 'device-token' } = {}) {
  const calls = [];
  const Notifications = {
    AndroidImportance: { MAX: 5 },
    setNotificationHandler: value => calls.push(['handler', value]),
    setNotificationChannelAsync: async (...args) => calls.push(['channel', ...args]),
    getPermissionsAsync: async () => ({ status }),
    requestPermissionsAsync: async value => { calls.push(['permission', value]); return { status: granted ? 'granted' : 'denied' }; },
    getDevicePushTokenAsync: async () => { calls.push(['token']); return { data: token }; },
  };
  const source = fs.readFileSync('src/services/notificationService.js', 'utf8').replace(/^import .*;$/gm, '').replace(/export const /g, 'const ') + '\nmodule.exports = { registerForPushNotifications, clearPushTokenOnServer, initializeNotifications };';
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, Notifications, Platform: { OS: os }, API_BASE_URL: 'https://test.invalid', getAuthToken: async () => auth,
    axios: { put: async (...args) => calls.push(['sync', ...args]) }, console,
  });
  return { ...module.exports, calls };
}
test('Android creates the sound channel before permission and token requests', async () => {
  const service = load();
  await service.registerForPushNotifications();
  assert.deepEqual(service.calls.map(c => c[0]), ['channel', 'permission', 'token', 'sync']);
  assert.equal(service.calls[0][1], 'oktreat-default-v3');
  assert.equal(service.calls[0][2].sound, 'notification');
  assert.equal(service.calls[3][2].pushToken, 'device-token');
});
test('denied permission never fetches or syncs a token', async () => {
  const service = load({ os: 'ios', granted: false });
  assert.equal(await service.registerForPushNotifications(), null);
  assert.deepEqual(service.calls.map(c => c[0]), ['permission']);
});
test('iOS explicitly asks for sound and preserves native APNs token for backend routing', async () => {
  const token = 'ab'.repeat(32);
  const service = load({ os: 'ios', token });
  assert.equal(await service.registerForPushNotifications(), token);
  assert.equal(service.calls[0][1].ios.allowSound, true);
  assert.equal(service.calls.find(c => c[0] === 'sync')[2].pushToken, token);
});
test('logged-out registration never writes a device token to another account', async () => {
  const service = load({ status: 'granted', auth: null });
  await service.registerForPushNotifications();
  assert.equal(service.calls.some(c => c[0] === 'sync'), false);
});
test('logout clears push registration, and modern handler allows visible, audible foreground alerts', async () => {
  const service = load();
  await service.clearPushTokenOnServer();
  assert.equal(service.calls[0][2].pushToken, null);
  await service.initializeNotifications();
  const result = await service.calls[1][1].handleNotification();
  assert.equal(result.shouldPlaySound, true);
  assert.equal(result.shouldShowBanner, true);
  assert.equal(result.shouldShowList, true);
});
