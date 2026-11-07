const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function setup(prevent = false) {
  const createElement = (type, props, ...children) => ({ type, props: props || {}, children: children.flat() });
  const source = fs.readFileSync('src/components/ClearTabBar.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const transformed = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code;
  const context = { useTranslation: () => ({ t: (key, options) => options.defaultValue }), React: { createElement }, View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity', StyleSheet: { create: x => x }, useSafeAreaInsets: () => ({ bottom: 34 }) };
  vm.runInNewContext(transformed + '\nthis.Bar=ClearTabBar;', context);
  const routes = [{ key: 'home', name: 'Home' }, { key: 'pets', name: 'Pets', params: { screen: 'PetList' } }];
  const events = [], navigated = [];
  const tree = context.Bar({ state: { index: 0, routes }, descriptors: { home: { options: { tabBarLabel: 'Home' } }, pets: { options: { tabBarLabel: 'Your Pets' } } }, navigation: { emit: event => { events.push(event); return { defaultPrevented: prevent }; }, navigate: (...args) => navigated.push(args) } });
  return { tree, tabs: tree.children[0].children, events, navigated };
}
test('tabs expose labels and selection and reserve the home-indicator inset', () => {
  const s = setup(); assert.equal(s.tree.props.style[1].paddingBottom, 42);
  assert.equal(s.tabs[0].props.accessibilityState.selected, true);
  assert.equal(s.tabs[1].props.accessibilityLabel, 'Your Pets');
  assert.equal(s.tabs[1].props.accessibilityState.selected, false);
  assert.equal(s.tabs[0].props.style[1].backgroundColor, '#E2F3FB');
});
test('press and long press preserve React Navigation events and route params', () => {
  const s = setup(); s.tabs[1].props.onPress();
  assert.equal(s.events[0].type, 'tabPress'); assert.equal(s.events[0].target, 'pets');
  assert.equal(s.navigated[0][0], 'Pets'); assert.equal(s.navigated[0][1].screen, 'PetList');
  s.tabs[1].props.onLongPress(); assert.equal(s.events[1].type, 'tabLongPress');
});
test('prevented presses and selected tabs never navigate again', () => {
  const s = setup(true); s.tabs[1].props.onPress(); assert.equal(s.navigated.length, 0);
  const active = setup(); active.tabs[0].props.onPress(); assert.equal(active.navigated.length, 0);
});
