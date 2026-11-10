import i18n from '../i18n';
import { copy } from '../i18n/copy';

// Display only: do not translate stored enum values, names, IDs or payment amounts.
export function displayLocale() {
  const code = (i18n.resolvedLanguage || i18n.language || 'en-us').toLowerCase();
  return code === 'en-uk' ? 'en-GB' : code;
}
export function relativeTime(dateString, now = Date.now()) {
  if (!dateString) return '';
  const minutes = Math.floor((now - new Date(dateString).getTime()) / 60000);
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return copy('Just now');
  if (minutes < 60) return copy('{{count}} min ago', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return copy('1 hour ago');
  if (hours < 24) return copy('{{count}} hours ago', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return copy('Yesterday');
  if (days < 7) return copy('{{count}} days ago', { count: days });
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? copy('1 week ago') : copy('{{count}} weeks ago', { count: weeks });
}
