const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function setup(prevent = false) {
  const createElement = (type, props, ...children) => ({ type, props: props || {}, children: children.flat() });
  const source = fs.readFileSync('src/components/ClearTabBar.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const transformed = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code;
  class AnimatedValue {
    constructor(value) { this.value = value; }
    setValue(next) { this.value = next; }
    interpolate() { return {}; }
  }
  const animation = { start() {}, stop() {} };
  const context = {
    useTranslation: () => ({ t: (key, options) => options.defaultValue }),
    React: { createElement },
    View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
    Animated: {
      Value: AnimatedValue, View: 'Animated.View',
      timing: () => animation, spring: () => animation, parallel: () => animation,
    },
    Easing: { out: value => value, quad: value => value },
    useEffect() {}, useRef: value => ({ current: value }), useState: value => [value, () => {}],
    StyleSheet: { create: x => x }, useSafeAreaInsets: () => ({ bottom: 34 }),
  };
  vm.runInNewContext(transformed + '\nthis.Bar=ClearTabBar; this.TabButton=TabButton;', context);
  const routes = [{ key: 'home', name: 'Home' }, { key: 'pets', name: 'Pets', params: { screen: 'PetList' } }];
  const events = [], navigated = [];
  const tree = context.Bar({ state: { index: 0, routes }, descriptors: { home: { options: { tabBarLabel: 'Home' } }, pets: { options: { tabBarLabel: 'Your Pets' } } }, navigation: { emit: event => { events.push(event); return { defaultPrevented: prevent }; }, navigate: (...args) => navigated.push(args) } });
  const find = (node, predicate) => !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...(node.children || []).flatMap(child => find(child, predicate))];
  const tabs = find(tree, node => typeof node.type === 'function' && node.type.name === 'TabButton');
  const highlight = find(tree, node => node.props?.pointerEvents === 'none' && node.props?.style?.[0]?.backgroundColor === '#E2F3FB')[0];
  return { tree, highlight, tabs, events, navigated, context };
}
function renderTab(setupResult, index) {
  const element = setupResult.tabs[index];
  return setupResult.context.TabButton(element.props);
}
test('tabs expose labels and selection and reserve the home-indicator inset', () => {
  const s = setup(); assert.equal(s.tree.props.style[1].paddingBottom, 42);
  const home = renderTab(s, 0), pets = renderTab(s, 1);
  assert.equal(home.props.accessibilityState.selected, true);
  assert.equal(pets.props.accessibilityLabel, 'Your Pets');
  assert.equal(pets.props.accessibilityState.selected, false);
  assert.equal(s.highlight.props.style[0].backgroundColor, '#E2F3FB');
});
test('press and long press preserve React Navigation events and route params', () => {
  const s = setup(); renderTab(s, 1).props.onPress();
  assert.equal(s.events[0].type, 'tabPress'); assert.equal(s.events[0].target, 'pets');
  assert.equal(s.navigated[0][0], 'Pets'); assert.equal(s.navigated[0][1].screen, 'PetList');
  renderTab(s, 1).props.onLongPress(); assert.equal(s.events[1].type, 'tabLongPress');
});
test('prevented presses and selected tabs never navigate again', () => {
  const s = setup(true); renderTab(s, 1).props.onPress(); assert.equal(s.navigated.length, 0);
  const active = setup(); renderTab(active, 0).props.onPress(); assert.equal(active.navigated.length, 0);
});
