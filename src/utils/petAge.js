// Keep this calendar-only helper in sync with the mobile and Smart Tag clients.
// Dates are stored as YYYY-MM-DD/SQL DATE; UTC avoids timezone/DST age drift.
function dateOnly(value = new Date()) {
  const text = value instanceof Date ? (Number.isNaN(value.getTime()) ? '' : value.toISOString()) : String(value || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(text);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? text.slice(0, 10) : null;
}

function elapsedMonths(from, to) {
  const start = dateOnly(from), end = dateOnly(to);
  if (!start || !end || start > end) return null;
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  const anniversaryDay = Math.min(sd, new Date(Date.UTC(ey, em, 0)).getUTCDate());
  return (ey - sy) * 12 + em - sm - (ed < anniversaryDay ? 1 : 0);
}

function getPetAge(pet, now = new Date()) {
  if (!pet) return null;
  let totalMonths;
  const estimated = !pet.dateOfBirth;
  if (!estimated) {
    totalMonths = elapsedMonths(pet.dateOfBirth, now);
  } else {
    const known = [pet.ageYears, pet.ageMonths].some(value => value !== null && value !== undefined && value !== '');
    if (!known) return null;
    const years = Number(pet.ageYears || 0), months = Number(pet.ageMonths || 0);
    if (![years, months].every(n => Number.isInteger(n) && n >= 0)) return null;
    // API snapshots carry ageAsOf so clients never add elapsed months twice.
    const anchor = pet.ageAsOf || pet.ageRecordedAt;
    totalMonths = years * 12 + months + (anchor ? elapsedMonths(anchor, now) || 0 : 0);
  }
  return totalMonths === null ? null : { years: Math.floor(totalMonths / 12), months: totalMonths % 12, estimated };
}

function formatPetAge(pet, now = new Date()) {
  const age = getPetAge(pet, now);
  if (!age) return 'Age not specified';
  const parts = [];
  if (age.years) parts.push(`${age.years} year${age.years === 1 ? '' : 's'}`);
  if (age.months) parts.push(`${age.months} month${age.months === 1 ? '' : 's'}`);
  const label = parts.length ? `${parts.join(' & ')} old` : 'Under 1 month old';
  return age.estimated ? `About ${label.charAt(0).toLowerCase()}${label.slice(1)}` : label;
}

function withCurrentPetAge(pet, now = new Date()) {
  if (!pet) return pet;
  const age = getPetAge(pet, now);
  return { ...pet, ageYears: age?.years ?? null, ageMonths: age?.months ?? null, ageAsOf: dateOnly(now) };
}

module.exports = { dateOnly, elapsedMonths, getPetAge, formatPetAge, withCurrentPetAge };
