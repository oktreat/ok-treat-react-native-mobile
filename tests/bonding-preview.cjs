const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function setup() {
  let index = 0; const states = []; const alerts = [];
  const createElement = (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter(Boolean) });
  const source = fs.readFileSync('src/screens/community/BondingScreen.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const code = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code;
  const context = { React: { createElement }, copy: value => value, useCopyUpdates: () => {}, useState: initial => { const slot = index++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }]; }, useMemo: fn => fn(), Alert: { alert: (...args) => alerts.push(args) }, Platform: { OS: 'ios' }, Share: { share: async () => {} }, StyleSheet: { create: x => x }, Icon: 'Icon', MapView: 'MapView', Marker: 'Marker', PalsProfilePreview: 'PalsProfilePreview', ScreenWrapper: 'ScreenWrapper' };
  for (const name of ['Modal', 'ScrollView', 'Switch', 'Text', 'TextInput', 'TouchableOpacity', 'View']) context[name] = name;
  vm.runInNewContext(code + '\nthis.Screen=BondingScreen;', context);
  const render = () => { index = 0; return context.Screen({ navigation: { goBack() {} } }); };
  const all = (tree, predicate) => [tree, ...tree.children.flatMap(c => typeof c === 'object' ? all(c, () => true) : [])].filter(predicate);
  return { render, all, alerts };
}
test('destination and activity filters update map and member cards without location access', () => {
  const h = setup(); let tree = h.render();
  assert.equal(h.all(tree, x => x.type === 'Marker').length, 3);
  assert.equal(h.all(tree, x => x.props.values?.includes('Vancouver')).length, 0);
  const activity = h.all(tree, x => x.props.values?.includes('Meals'))[0]; activity.props.onSelect('Meals');
  tree = h.render(); const map = h.all(tree, x => x.type === 'MapView')[0];
  assert.equal(map.props.initialRegion.latitude, 49.2827); assert.equal(map.props.showsUserLocation, false);
  assert.equal(h.all(tree, x => x.type === 'Marker').length, 1);
  assert.equal(h.all(tree, x => x.type === 'Switch')[0].props.value, false);
});
test('sample requests deduplicate and blocking removes member from discovery', () => {
  const h = setup(); let tree = h.render(); h.all(tree, x => x.type === 'Marker')[0].props.onPress();
  tree = h.render(); h.all(tree, x => x.props.title === 'Try a connection request')[0].props.onPress();
  assert.equal(h.alerts[0][0], 'Preview request saved');
  tree = h.render(); h.all(tree, x => x.type === 'Marker')[0].props.onPress();
  tree = h.render(); assert.equal(h.all(tree, x => x.props.title === 'Sample request pending')[0].props.disabled, true);
  h.all(tree, x => x.props.title === 'Block sample member')[0].props.onPress();
  tree = h.render(); assert.equal(h.all(tree, x => x.type === 'Marker').length, 2);
});
test('meetup cannot be saved until all required details are supplied', () => {
  const h = setup(); let tree = h.render(); h.all(tree, x => x.props.title === 'Create a sample meetup')[0].props.onPress();
  tree = h.render(); assert.equal(h.all(tree, x => x.props.title === 'Save sample plan')[0].props.disabled, true);
  for (const [label, value] of [['Activity title', 'Coffee'], ['Public venue', 'Harbour café'], ['Date and time', 'Saturday 2 PM']]) {
    h.all(tree, x => x.props.accessibilityLabel === label)[0].props.onChangeText(value);
  }
  tree = h.render(); assert.equal(h.all(tree, x => x.props.title === 'Save sample plan')[0].props.disabled, false);
  h.all(tree, x => x.props.title === 'Save sample plan')[0].props.onPress();
  tree = h.render(); assert.equal(h.all(tree, x => x.props.title === 'Share sample plan').length, 1);
});


test('join profile form is reachable without publishing a profile', () => { const h = setup(); let tree = h.render(); h.all(tree, x => x.props.title === 'Join Pals / edit preview profile')[0].props.onPress(); tree = h.render(); assert.equal(h.all(tree, x => x.type === 'PalsProfilePreview').length, 1); });
