const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const i18next = require('i18next');
const source = fs.readFileSync('src/i18n/preferences.js', 'utf8').replace(/export /g, '');
const ctx = {}; vm.runInNewContext(source + '\nthis.p={resolveLanguage,resolveCurrency,formatUSD};', ctx);
const { resolveLanguage, resolveCurrency, formatUSD } = ctx.p;
test('phone language and region remain independent; manual preferences override each', () => {
  const japaneseCanada = [{ languageCode: 'ja', languageTag: 'ja-CA', regionCode: 'CA' }];
  assert.equal(resolveLanguage('system', japaneseCanada), 'ja');
  assert.equal(resolveCurrency('system', japaneseCanada), 'CAD');
  assert.equal(resolveLanguage('en-uk', japaneseCanada), 'en-uk');
  assert.equal(resolveCurrency('USD', japaneseCanada), 'USD');
  assert.equal(resolveCurrency('system', [{ regionCode: 'JP' }]), 'JPY');
  assert.equal(resolveCurrency('system', [{ regionCode: 'US' }]), 'USD');
});
test('unsupported and malformed saved preferences fall back safely', () => {
  assert.equal(resolveLanguage('unsupported', [{ languageCode: 'fr' }, { languageCode: 'ja' }]), 'ja');
  assert.equal(resolveLanguage(null, []), 'en-us');
  assert.equal(resolveLanguage('system', [{ languageTag: 'en-GB' }]), 'en-uk');
  assert.equal(resolveCurrency('GBP', []), 'USD');
});
test('USD-only pricing is explicit and does not use zero-decimal JPY formatting', () => {
  assert.equal(formatUSD(2499), 'US$24.99');
  assert.equal(formatUSD(4499), 'US$44.99');
});
test('Japanese and Chinese v2 texts resolve without English fallback or raw keys', async () => {
  const i = i18next.createInstance();
  const resources = {};
  for (const lng of ['en-us','en-uk','ja','zh']) resources[lng] = { translation: JSON.parse(fs.readFileSync(`src/i18n/locales/${lng}.json`, 'utf8')) };
  await i.init({ resources, lng: 'ja', fallbackLng: 'en-us', load: 'currentOnly', interpolation: { escapeValue: false } });
  const keys = Object.entries(resources['en-us'].translation).flatMap(([group, values]) => Object.keys(values).map(key => `${group}.${key}`));
  for (const lng of ['ja','zh']) {
    await i.changeLanguage(lng);
    for (const key of keys) assert.ok(i.getResource(lng,'translation',key), `${lng}: ${key}`);
    assert.ok(i.t('shop.localPending', {currency:'JPY'}).includes('JPY'));
    assert.ok(i.t('shop.pay', {amount:formatUSD(4499)}).includes('US$44.99'));
    assert.notEqual(i.t('home.addPet'), 'Add a Pet');
  }
});
