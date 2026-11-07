import api from '../config/api';
import * as Localization from 'expo-localization';

export function phoneRegion() {
  try { return Localization.getLocales?.()[0]?.regionCode || 'US'; }
  catch { return 'US'; }
}
export async function getPaymentMarket() {
  const response = await api.get('/coins/market', { params: { region: phoneRegion() } });
  return response.data.data;
}
export async function savePaymentCountry(country) {
  const response = await api.put('/coins/market', { country });
  return response.data.data;
}
export function countryName(country, language) {
  const locale = language === 'en-uk' ? 'en-GB' : language === 'en-us' ? 'en-US' : language;
  try { return new Intl.DisplayNames([locale || 'en'], { type: 'region' }).of(country); }
  catch { return country; }
}
