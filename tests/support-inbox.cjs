const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function harness(params = {}, request = async () => ({ data: { data: [] } })) {
  let si = 0, ri = 0, focus;
  const states = [], refs = [], navigations = [];
  const source = fs.readFileSync('src/screens/profile/SupportScreen.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const transformed = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code;
  const context = {
    copy: (text, values = {}) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? ''), useCopyUpdates() {},
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter(Boolean) }), Fragment: 'Fragment' },
    useState: initial => { const i = si++; if (!(i in states)) states[i] = initial; return [states[i], value => states[i] = typeof value === 'function' ? value(states[i]) : value]; },
    useRef: initial => { const i = ri++; return refs[i] ||= { current: initial }; },
    useEffect() {}, useCallback: f => f, useFocusEffect: f => { focus = f; },
    useSafeAreaInsets: () => ({ bottom: 20 }), useRemoteConfig: () => ({ supportEmail: 'careteam@oktreat.com' }),
    Crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' },
    api: { get: request, post: request }, AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
    Linking: { openURL: async () => {} }, StyleSheet: { create: x => x }, setInterval: () => 1, clearInterval() {},
  };
  for (const type of ['ScreenWrapper', 'View', 'Text', 'TextInput', 'TouchableOpacity', 'ScrollView', 'KeyboardAwareScrollView', 'KeyboardStickyView', 'ActivityIndicator', 'BackArrowIcon']) context[type] = type;
  vm.runInNewContext(transformed + '\nthis.Screen=SupportScreen;', context);
  const render = () => { si = 0; ri = 0; return context.Screen({ route: { params }, navigation: { goBack() {}, navigate: (...args) => navigations.push(args) } }); };
  const nodes = tree => tree && typeof tree === 'object' ? [tree, ...(tree.children || []).flatMap(nodes)] : [];
  const find = (predicate) => nodes(render()).find(predicate);
  return { render, find, states, focus: () => focus(), navigations };
}
test('support starts with in-app requests and safety reporting, without a personal call action', () => {
  const h = harness();
  assert.ok(h.find(n => n.props.title === 'Get help'));
  assert.ok(h.find(n => n.props.title === 'Report a safety concern'));
  assert.equal(h.find(n => /Call OkTreat/.test(n.props.title || '')), undefined);
});
test('support history keeps five visible and navigates to the next page', async () => {
  const paths = [];
  const h = harness({}, async path => { paths.push(path); return { data: { data: Array.from({ length: 5 }, (_, i) => ({ id: 'case-' + i, subject: 'Request ' + i, category: 'app', status: 'open' })), pagination: { hasMore: true } } }; });
  h.render(); h.focus(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(paths[0], '/support/cases?page=0&status=open');
  assert.equal(h.states[2].length, 5);
  h.find(n => n.props.title === 'Next 5').props.onPress();
  h.render(); h.focus(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(paths[1], '/support/cases?page=1&status=open');
  assert.equal(h.states[2].length, 5);
});
test('safety selection opens the report form and cannot submit empty details', () => {
  const h = harness(); h.find(n => n.props.title === 'Report a safety concern').props.onPress();
  assert.equal(h.states[4], 'safety');
  assert.equal(h.find(n => n.props.title === 'Send request').props.disabled, true);
  assert.ok(h.find(n => n.type === 'Text' && n.children.some(x => typeof x === 'string' && x.includes('not an emergency service'))));
});
test('request double taps send once and open the returned case', async () => {
  let calls = 0, finish;
  const h = harness({}, () => { calls++; return new Promise(resolve => { finish = resolve; }); });
  h.find(n => n.props.title === 'Get help').props.onPress();
  h.find(n => n.props.accessibilityLabel === 'Support subject').props.onChangeText('Booking help');
  h.find(n => n.props.accessibilityLabel === 'Support details').props.onChangeText('Please help with my booking.');
  const send = h.find(n => n.props.title === 'Send request'); assert.equal(send.props.disabled, false);
  const pending = send.props.onPress(); await send.props.onPress(); assert.equal(calls, 1);
  finish({ data: { data: { id: 'my-case' } } }); await pending;
  assert.equal(h.states[0], 'thread'); assert.equal(h.states[1], 'my-case');
});
test('push deep links load the case through the authenticated app API', async () => {
  const paths = [];
  const h = harness({ supportCaseId: 'my-case' }, async path => { paths.push(path); return { data: { data: { messages: [], id: 'my-case', subject: 'Help' } } }; });
  h.render(); h.focus(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(paths, ['/support/cases/my-case/messages']);
});

for (const [label, conversationId, expected] of [['internal', null, 'Case #internal · Open'], ['legacy Chatwoot', 12, 'Case #12 · Open']]) {
  test(label + ' support threads display a usable case reference', async () => {
    const h = harness({ supportCaseId: 'internal-case-123' }, async () => ({ data: { data: { id: 'internal-case-123', conversationId, subject: 'Help', status: 'open', messages: [] } } }));
    h.render(); h.focus(); await new Promise(resolve => setImmediate(resolve));
    assert.ok(h.find(n => n.type === 'Text' && n.children.includes(expected)));
  });
}
