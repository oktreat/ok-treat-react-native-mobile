import { useTranslation } from 'react-i18next';
import i18n from './index';

// Natural-language keys are restricted to fixed interface copy. Names,
// messages, IDs, amounts and API enum values stay unchanged.
export function copy(text, values = {}) {
  if (typeof text !== 'string') return text;
  return i18n.t(text, { ...values, ns: 'copy', keySeparator: false, nsSeparator: false, defaultValue: text });
}
export function useCopyUpdates() { useTranslation('copy'); }

export function serviceLabel(value) {
  const labels = { BOARDING: 'Boarding', HOUSE_SITTING: 'House Sitting', DROP_IN_VISITS: 'Drop-In Visits', DROP_IN: 'Drop-In Visits', DAY_CARE: 'Day Care', PET_WALKING: 'Pet Walking', DOG_WALKING: 'Pet Walking' };
  return copy(labels[value] || value);
}
