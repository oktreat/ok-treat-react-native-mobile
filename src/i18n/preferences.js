export const CURRENCIES = ['USD', 'CAD', 'JPY'];
export function resolveLanguage(saved, locales = []) {
  if (['en-us', 'en-uk', 'ja', 'zh', 'fr'].includes(saved)) return saved;
  for (const locale of locales) {
    const tag = (locale.languageTag || '').toLowerCase();
    const lang = (locale.languageCode || tag.split('-')[0]).toLowerCase();
    if (lang === 'ja' || lang === 'zh' || lang === 'fr') return lang;
    if (lang === 'en') return tag.startsWith('en-gb') ? 'en-uk' : 'en-us';
  }
  return 'en-us';
}
export function resolveCurrency(saved, locales = []) {
  if (CURRENCIES.includes(saved)) return saved;
  const region = (locales[0]?.regionCode || '').toUpperCase();
  return region === 'CA' ? 'CAD' : region === 'JP' ? 'JPY' : 'USD';
}
export function formatUSD(cents) {
  return `US$${(Number(cents || 0) / 100).toFixed(2)}`;
}
