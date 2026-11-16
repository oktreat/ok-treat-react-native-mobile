export const APP_STORE_URL = 'https://apps.apple.com/app/id6479255523';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.oktreat.app';

export function storeFallback(platform) {
  return platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
}

// Preserve configured links only when they identify this app in the right store.
export function appStoreLink(platform, configured) {
  const fallback = storeFallback(platform);
  try {
    const url = new URL(configured);
    if (platform === 'ios') {
      return url.protocol === 'https:' && url.hostname === 'apps.apple.com'
        && /\/id6479255523\/?$/.test(url.pathname) ? url.href : fallback;
    }
    return ((url.protocol === 'https:' && url.hostname === 'play.google.com' && url.pathname === '/store/apps/details')
      || (url.protocol === 'market:' && url.hostname === 'details'))
      && url.searchParams.get('id') === 'com.oktreat.app' ? url.href : fallback;
  } catch { return fallback; }
}

export async function openAppStore(linking, platform, configured) {
  const fallback = storeFallback(platform);
  const requested = appStoreLink(platform, configured);
  try {
    await linking.openURL(requested);
  } catch {
    if (requested !== fallback) await linking.openURL(fallback);
  }
}
