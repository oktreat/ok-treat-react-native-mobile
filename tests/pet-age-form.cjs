const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ageFormFromPet, ageInputFromForm, petFormPayload } = require('../src/utils/petAgeForm');
const now = new Date('2026-11-18T12:00:00Z');
test('opening an existing pet preserves its birthday or estimated current age', () => {
  assert.deepEqual(ageFormFromPet({ dateOfBirth: '2023-11-18T00:00:00.000Z' }, now), { ageMode: 'birthday', dateOfBirth: '2023-11-18', ageYears: '3', ageMonths: '0' });
  const form = ageFormFromPet({ ageYears: 0, ageMonths: 11, ageRecordedAt: '2026-10-18' }, now);
  assert.equal(form.ageMode, 'estimate'); assert.equal(form.ageYears, '1'); assert.equal(form.ageMonths, '0');
});
test('saving birthday mode sends date-only and compatibility ages', () => {
  assert.deepEqual(ageInputFromForm({ ageMode: 'birthday', dateOfBirth: '2023-11-18', ageYears: '99' }, now), { dateOfBirth: '2023-11-18', ageYears: 3, ageMonths: 0 });
});
test('estimated mode clears a birthday explicitly and preserves newborn zeros', () => {
  assert.deepEqual(ageInputFromForm({ ageMode: 'estimate', dateOfBirth: '2023-01-01', ageYears: '0', ageMonths: '0' }, now), { dateOfBirth: null, ageYears: 0, ageMonths: 0 });
});
test('incomplete and invalid form values cannot be saved', () => {
  for (const form of [{ ageMode: 'birthday', dateOfBirth: '' }, { ageMode: 'birthday', dateOfBirth: '2027-01-01' }, { ageMode: 'estimate', ageYears: '', ageMonths: '' }, { ageMode: 'estimate', ageYears: '3', ageMonths: '12' }, { ageMode: 'estimate', ageYears: '3.5' }]) assert.throws(() => ageInputFromForm(form, now));
});
test('age serialization preserves the rest of the pet and does not add fields to unrelated calls', () => {
  const form = { name: 'Toto', qrCode: 'TEST-TAG', description: 'A friendly dog', ageMode: 'estimate', ageYears: '3', ageMonths: '0' };
  const payload = petFormPayload(form);
  assert.equal(payload.name, form.name); assert.equal(payload.qrCode, form.qrCode); assert.equal(payload.description, form.description); assert.equal(payload.ageMode, undefined);
  assert.deepEqual(petFormPayload({ description: 'Updated' }), { description: 'Updated' });
});
