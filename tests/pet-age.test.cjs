const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dateOnly, getPetAge, formatPetAge, withCurrentPetAge } = require('../src/utils/petAge');

test('birthday advances at the monthly and annual anniversary', () => {
  const pet = { dateOfBirth: '2023-11-19' };
  assert.deepEqual(getPetAge(pet, '2026-11-18'), { years: 2, months: 11, estimated: false });
  assert.deepEqual(getPetAge(pet, '2026-11-19'), { years: 3, months: 0, estimated: false });
  assert.deepEqual(getPetAge(pet, '2026-12-19'), { years: 3, months: 1, estimated: false });
});
test('month end and leap-day anniversaries clamp to the final valid day', () => {
  assert.equal(getPetAge({ dateOfBirth: '2024-02-29' }, '2025-02-27').months, 11);
  assert.equal(getPetAge({ dateOfBirth: '2024-02-29' }, '2025-02-28').years, 1);
  assert.equal(getPetAge({ dateOfBirth: '2026-01-31' }, '2026-02-28').months, 1);
  assert.equal(getPetAge({ dateOfBirth: '2026-01-31' }, '2026-03-30').months, 1);
});
test('newborn zero is different from an unknown age', () => {
  assert.equal(formatPetAge({ dateOfBirth: '2026-11-18' }, '2026-11-18'), 'Under 1 month old');
  assert.equal(getPetAge({ ageYears: 0, ageMonths: 0 }, '2026-11-18').years, 0);
  assert.equal(getPetAge({ ageYears: null, ageMonths: null }), null);
  assert.equal(formatPetAge({}), 'Age not specified');
});
test('invalid and future birthdays do not produce negative or rolled-over ages', () => {
  for (const dateOfBirth of ['2026-02-30', '2026-13-01', 'not a date', '2027-01-01']) assert.equal(getPetAge({ dateOfBirth }, '2026-11-18'), null);
});
test('date-only values and database UTC dates give identical results across timezones', () => {
  assert.equal(dateOnly(new Date('2024-02-29T00:00:00.000Z')), '2024-02-29');
  assert.deepEqual(getPetAge({ dateOfBirth: new Date('2024-02-29T00:00:00.000Z') }, '2026-11-18'), getPetAge({ dateOfBirth: '2024-02-29' }, '2026-11-18'));
});
test('legacy age is preserved and then advances from its recorded date', () => {
  const pet = { ageYears: 3, ageMonths: 11, ageRecordedAt: '2026-11-18' };
  assert.deepEqual(getPetAge(pet, '2026-11-18'), { years: 3, months: 11, estimated: true });
  assert.deepEqual(getPetAge(pet, '2026-12-18'), { years: 4, months: 0, estimated: true });
  assert.equal(formatPetAge(pet, '2026-12-18'), 'About 4 years old');
});
test('server snapshots are not aged twice when clients display them', () => {
  const raw = { ageYears: 2, ageMonths: 0, ageRecordedAt: '2025-11-18', name: 'Test pet' };
  const snapshot = withCurrentPetAge(raw, '2026-11-18');
  assert.equal(snapshot.ageYears, 3);
  assert.equal(snapshot.ageRecordedAt, raw.ageRecordedAt);
  assert.equal(getPetAge(snapshot, '2026-11-18').years, 3);
  assert.equal(getPetAge(snapshot, '2026-12-18').months, 1);
  assert.equal(withCurrentPetAge(snapshot, '2026-11-18').ageYears, 3);
  assert.equal(raw.ageYears, 2);
});
