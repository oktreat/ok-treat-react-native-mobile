export const CURRENCIES = ['USD', 'CAD', 'JPY', 'AUD', 'GBP', 'EUR'];
export function resolveLanguage(saved, locales = []) {
  if (['en-us', 'en-uk', 'ja', 'zh', 'fr', 'de'].includes(saved)) return saved;
  for (const locale of locales) {
    const tag = (locale.languageTag || '').toLowerCase();
    const lang = (locale.languageCode || tag.split('-')[0]).toLowerCase();
    if (lang === 'ja' || lang === 'zh' || lang === 'fr' || lang === 'de') return lang;
    if (lang === 'en') return tag.startsWith('en-gb') ? 'en-uk' : 'en-us';
  }
  return 'en-us';
}
export function resolveCurrency(saved, locales = []) {
  if (CURRENCIES.includes(saved)) return saved;
  const region = (locales[0]?.regionCode || '').toUpperCase();
  return region === 'CA' ? 'CAD' : region === 'JP' ? 'JPY' : region === 'AU' ? 'AUD' : ['GB','UK'].includes(region) ? 'GBP' : ['AT','BE','HR','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU','MT','NL','PT','SK','SI','ES'].includes(region) ? 'EUR' : 'USD';
}
export function formatUSD(cents) {
  return `US$${(Number(cents || 0) / 100).toFixed(2)}`;
}

export function formatCharge(amount, currency, language = 'en-us') {
  if (!Number.isSafeInteger(amount) || amount < 0 || !['USD', 'CAD', 'JPY', 'AUD', 'GBP', 'EUR'].includes(currency)) return '—';
  if (currency === 'USD') return formatUSD(amount);
  const digits = currency === 'JPY' ? 0 : 2;
  const locale = language === 'en-uk' ? 'en-GB' : language === 'en-us' ? 'en-US' : language;
  const number = new Intl.NumberFormat(locale || 'en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount / (10 ** digits));
  return `${currency} ${number}`;
}

