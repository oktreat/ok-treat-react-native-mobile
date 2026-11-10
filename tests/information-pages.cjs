const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
function moduleFrom(path, names) {
  const source = fs.readFileSync(path, 'utf8').replace(/export default TERMS;/, '').replace(/export (const|function) /g, '$1 ');
  return vm.runInNewContext(source + '\n({' + names.join(',') + '})');
}
const content = moduleFrom('src/screens/settings/informationContent.js', ['getInformation','INFORMATION_LANGUAGES','INFORMATION_PAGES']);
const { TERMS } = moduleFrom('src/screens/settings/existingTerms.js', ['TERMS']);
function harness(language = 'en-us', page) {
  const state = []; let index = 0;
  const calls = [];
  const context = {
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter(x => x !== false && x != null) }), Fragment: 'Fragment' },
    useState: initial => { const i = index++; if (!(i in state)) state[i] = initial; return [state[i], next => state[i] = typeof next === 'function' ? next(state[i]) : next]; },
    useTranslation: () => ({ i18n: { resolvedLanguage: language } }), getInformation: content.getInformation, existingTerms: TERMS, StyleSheet: { create: x => x },
  };
  for (const type of ['ScreenWrapper','View','Text','TouchableOpacity','ScrollView','BackArrowIcon']) context[type] = type;
  const source = fs.readFileSync('src/screens/settings/InformationScreen.js','utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const code = babel.transformSync(source,{configFile:false,babelrc:false,plugins:[['@babel/plugin-transform-react-jsx',{runtime:'classic'}]]}).code;
  vm.runInNewContext(code+'\nthis.Screen=InformationScreen;',context);
  function render() { index = 0; return context.Screen({route:{params:{page}},navigation:{goBack:()=>calls.push('back'),navigate:(...args)=>calls.push(args)}}); }
  const nodes = t => t && typeof t === 'object' ? [t,...t.children.flatMap(nodes)] : [];
  const text = t => t && typeof t === 'object' ? t.children.map(text).join(' ') : String(t ?? '');
  return { render, nodes, text, calls, language: next => language = next };
}
for (const lang of content.INFORMATION_LANGUAGES) {
  test('four native pages render complete content in ' + lang, () => {
    for (const page of content.INFORMATION_PAGES) {
      const h=harness(lang,page); const tree=h.render(); const data=content.getInformation(lang,page);
      assert.ok(h.text(tree).includes(data.title));
      assert.ok(data.sections.length >= 4);
      for (const [title,body] of data.sections) { assert.ok(title && body); assert.ok(h.text(tree).includes(body)); }
      if (!lang.startsWith('en')) assert.notEqual(data.title,content.getInformation('en-us',page).title);
      const support=h.nodes(tree).find(n=>n.type==='TouchableOpacity'&&h.text(n).includes(data.support));
      support.props.onPress(); assert.equal(h.calls[0][0],'HelpSupport');
      const back=h.nodes(tree).find(n=>n.props.accessibilityLabel===data.back); back.props.onPress(); assert.equal(h.calls[1],'back');
    }
  });
}
test('language changes rerender the currently open native page',()=>{
  const h=harness('en-us','privacyChoices'); assert.ok(h.text(h.render()).includes('Privacy Choices'));
  h.language('ja'); assert.ok(h.text(h.render()).includes('プライバシーの選択'));
});
test('translated Terms guide expands and collapses the complete existing English terms offline',()=>{
  const h=harness('fr','terms'); let tree=h.render();
  assert.ok(!h.text(tree).includes(TERMS.body[3]));
  const toggle=()=>h.nodes(h.render()).find(n=>n.props.accessibilityState && 'expanded' in n.props.accessibilityState);
  assert.equal(toggle().props.accessibilityState.expanded,false); toggle().props.onPress();
  tree=h.render(); for(const paragraph of TERMS.body) assert.ok(h.text(tree).includes(paragraph));
  assert.equal(toggle().props.accessibilityState.expanded,true); toggle().props.onPress();
  assert.ok(!h.text(h.render()).includes(TERMS.body[3]));
});
test('missing and unknown page or language safely show English privacy content',()=>{
  for(const page of [undefined,'no-such-page']) assert.equal(content.getInformation('xx',page).title,'Privacy Policy');
});
test('Settings routes all four entries to native screens, without browser or permission mutations',()=>{
  const source=fs.readFileSync('src/screens/settings/SettingsScreen.js','utf8');
  assert.ok(!source.includes('openInAppBrowser'));
  for(const page of content.INFORMATION_PAGES) assert.ok(source.includes("params: { page: '"+page+"' }"));
  const navigator=fs.readFileSync('src/navigation/MainNavigator.js','utf8');
  assert.ok(navigator.includes('<RootStack.Screen name="Information" component={InformationScreen} />'));
  const screen=fs.readFileSync('src/screens/settings/InformationScreen.js','utf8');
  assert.ok(!/api\.|fetch\(|requestPermissions|openBrowserAsync/.test(screen));
});
