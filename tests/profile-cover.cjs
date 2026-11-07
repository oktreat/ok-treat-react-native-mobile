const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const babel = require('@babel/core');
const utils = {};
vm.runInNewContext(fs.readFileSync('src/utils/coverCrop.js', 'utf8').replace(/export /g, '') + '\nthis.api={coverCrop,coverUrl};', utils);
test('wide and tall image crops stay bounded at every position and zoom', () => {
  for (const [w, h] of [[4000, 3000], [3000, 4000], [6000, 1000], [500, 500]]) for (const zoom of [1, 2, 3]) for (const x of [0, 0.5, 1]) for (const y of [0, 0.5, 1]) {
    const c = utils.api.coverCrop(w, h, zoom, x, y);
    assert.ok(c.x >= 0 && c.y >= 0 && c.x + c.width <= w && c.y + c.height <= h);
    assert.ok(Math.abs(c.width / c.height - 2) < 0.02);
  }
  assert.throws(() => utils.api.coverCrop(0, 1));
});
test('delivery URL retains the uploaded asset and applies the chosen crop', () => {
  const url = utils.api.coverUrl('https://res.cloudinary.com/dnctinx0s/image/upload/v5/oktreat/sitters/a.jpg', { width: 1000, height: 500, x: 50, y: 100 });
  assert.match(url, /c_crop,w_1000,h_500,x_50,y_100/); assert.ok(url.endsWith('/v5/oktreat/sitters/a.jpg'));
  assert.throws(() => utils.api.coverUrl('https://evil.test/a.jpg', {}));
});
function harness({ canceled = false, fail = false } = {}) {
  let si = 0, ri = 0; const state = [], refs = [], calls = [], saved = [];
  const source = fs.readFileSync('src/components/ProfileCoverEditor.js', 'utf8').replace(/^import .*;\n/gm, '').replace('export default function', 'function');
  const context = { React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity).filter(Boolean) }), Fragment: 'Fragment' },
    useState: value => { const i = si++; if (!(i in state)) state[i] = value; return [state[i], v => state[i] = typeof v === 'function' ? v(state[i]) : v]; },
    useRef: value => refs[ri++] ||= { current: value },
    ImagePicker: { launchImageLibraryAsync: async () => ({ canceled, assets: [{ uri: 'file:///test.jpg', width: 3000, height: 2000 }] }) },
    Image: Object.assign('Image', { prefetch: async () => true }),
    uploadToCloudinary: async () => { calls.push('upload'); return { url: 'https://res.cloudinary.com/dnctinx0s/image/upload/v1/a.jpg', width: 3000, height: 2000 }; },
    api: { put: async (path, body) => { calls.push({ path, body }); if (fail) throw Error('Offline'); return { data: { success: true, data: { coverImage: body.coverPhoto } } }; } },
    CLOUDINARY_FOLDERS: { SITTERS: 'oktreat/sitters' }, ...utils.api, StyleSheet: { create: x => x },
  };
  for (const name of ['ActivityIndicator', 'Modal', 'ScrollView', 'Text', 'TouchableOpacity', 'View', 'SafeAreaView', 'Icon']) context[name] = name;
  vm.runInNewContext(babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-react-jsx'] }).code + '\nthis.Editor=ProfileCoverEditor;', context);
  const render = () => { si = 0; ri = 0; return context.Editor({ onSaved: url => saved.push(url) }); };
  const nodes = tree => tree && typeof tree === 'object' ? [tree, ...(tree.children || []).flatMap(nodes)] : [];
  const find = label => nodes(render()).find(n => n.props.accessibilityLabel === label || n.type === 'TouchableOpacity' && n.children.some(c => c.children?.includes(label)));
  return { find, state, calls, saved };
}
test('cancelled selection leaves the saved banner unchanged', async () => {
  const h = harness({ canceled: true }); h.find('Change cover photo').props.onPress(); await h.find('Choose photo').props.onPress(); assert.equal(h.state[0], null); assert.equal(h.calls.length, 0);
});
test('save uploads and changes only the cover; failures keep the draft for retry', async () => {
  for (const fail of [false, true]) {
    const h = harness({ fail }); h.find('Change cover photo').props.onPress(); await h.find('Choose photo').props.onPress(); await h.find('Save cover photo').props.onPress();
    assert.equal(h.calls[1].path, '/sitter/profile/cover'); assert.deepEqual(Object.keys(h.calls[1].body), ['coverPhoto']);
    assert.equal(h.saved.length, fail ? 0 : 1); assert.equal(h.state[7], fail);
  }
});
