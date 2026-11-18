const { dateOnly, getPetAge } = require('./petAge');

function ageFormFromPet(pet, now = new Date()) {
  const age = getPetAge(pet, now);
  return { ageMode: pet.dateOfBirth ? 'birthday' : 'estimate', dateOfBirth: dateOnly(pet.dateOfBirth) || '', ageYears: age ? String(age.years) : '', ageMonths: age ? String(age.months) : '' };
}

function ageInputFromForm(form, now = new Date()) {
  if (form.ageMode === 'birthday') {
    const birthday = dateOnly(form.dateOfBirth);
    if (!birthday || birthday > dateOnly(now)) throw new Error('Choose a birthday that is today or earlier.');
    const age = getPetAge({ dateOfBirth: birthday }, now);
    return { dateOfBirth: birthday, ageYears: age.years, ageMonths: age.months };
  }
  const years = String(form.ageYears ?? '').trim(), months = String(form.ageMonths ?? '').trim();
  if ((!years && !months) || (years && !/^\d+$/.test(years)) || (months && !/^\d+$/.test(months)) || Number(years) > 100 || Number(months) > 11) {
    throw new Error('Enter an estimated age: years from 0 to 100 and months from 0 to 11.');
  }
  return { dateOfBirth: null, ageYears: Number(years), ageMonths: Number(months) };
}

function validAgeForm(form) { try { ageInputFromForm(form); return true; } catch (_) { return false; } }
function petFormPayload(form) {
  const { ageMode, ...data } = form;
  return ageMode ? { ...data, ...ageInputFromForm(form) } : data;
}
module.exports = { ageFormFromPet, ageInputFromForm, validAgeForm, petFormPayload };
