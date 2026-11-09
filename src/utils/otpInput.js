export const PREFERRED_OTP_LENGTH = 6;
export const OTP_RESEND_SECONDS = 60;
// Old servers do not advertise a length; stay usable until the coordinated backend deploy.
export const receivedOtpLength = response => response?.data?.codeLength === 6 || response?.codeLength === 6 ? 6 : 4;
export function applyOtpInput(current, value, index, length = PREFERRED_OTP_LENGTH) {
  if (!Number.isInteger(index) || index < 0 || index >= length || !/^[0-9]*$/.test(value)) return null;
  const next = Array.from({ length }, (_, i) => current[i] || '');
  if (value === '') { next[index] = ''; return { digits: next, focus: index }; }
  const start = value.length >= length ? 0 : index;
  const digits = value.slice(0, length - start).split('');
  for (let i = 0; i < digits.length; i++) next[start + i] = digits[i];
  return { digits: next, focus: Math.min(length - 1, start + digits.length) };
}
export const completeOtp = (digits, length = PREFERRED_OTP_LENGTH) => digits.length === length && digits.every(d => /^[0-9]$/.test(d));
