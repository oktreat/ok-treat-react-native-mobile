const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = {};
vm.runInNewContext(fs.readFileSync('src/services/sitterMatching.js', 'utf8').replace(/export function/g, 'function') + '\nthis.rank=rankSitters;', context);
const rank = context.rank;
const sitter = (id, extra = {}) => ({ id, approvalStatus: 'APPROVED', availableForBooking: true, rating: 4.5, reviews: 5, distance: 3, yearsOfExperience: 3, pets: ['Dog'], services: { BOARDING: { petPreferences: ['Dog'], petSizePreference: ['Large'] } }, ...extra });
const ctx = { pet: { type: 'Dog', weight: 30, ageYears: 4 }, serviceType: 'BOARDING', rotationKey: 'session-a' };
test('equally suitable sitters rotate fairly across searches and remain stable within one search', () => {
  const candidates = [sitter('a'), sitter('b'), sitter('c')];
  const counts = { a: 0, b: 0, c: 0 };
  for (let i = 0; i < 900; i++) counts[rank(candidates, { ...ctx, rotationKey: String(i) })[0].id]++;
  for (const count of Object.values(counts)) assert.ok(count > 200 && count < 400, JSON.stringify(counts));
  assert.deepEqual(rank(candidates, ctx).map(s => s.id), rank([...candidates].reverse(), ctx).map(s => s.id));
});
test('rotation cannot move an unapproved or incompatible sitter ahead of a suitable bookable one', () => {
  const good = sitter('good');
  const incompatible = sitter('wrong-type', { pets: ['Cat'], rating: 5, reviews: 200, services: { BOARDING: { petPreferences: ['Cat'], petSizePreference: ['Small'] } } });
  const pending = sitter('pending', { approvalStatus: 'PENDING', rating: 5, reviews: 200 });
  for (let i = 0; i < 100; i++) {
    const result = rank([incompatible, pending, good], { ...ctx, rotationKey: String(i) });
    assert.equal(result[0].id, 'good'); assert.equal(result[1].matchEligible, false); assert.equal(result[2].matchEligible, false);
  }
});
test('a significantly stronger match is not displaced by fairness rotation', () => {
  const strong = sitter('strong', { distance: 1, reviews: 100, rating: 4.9, yearsOfExperience: 10 });
  const weak = sitter('weak', { distance: 29, reviews: 4, rating: 2, yearsOfExperience: 0 });
  for (let i = 0; i < 100; i++) assert.equal(rank([weak, strong], { ...ctx, rotationKey: String(i) })[0].id, 'strong');
});
test('a new sitter can rotate ahead of an established sitter when suitability is similar', () => {
  const newcomer = sitter('new', { reviews: 0, rating: 5, yearsOfExperience: 0, distance: 1 });
  const established = sitter('established', { reviews: 5, rating: 4, yearsOfExperience: 1, distance: 4 });
  const firsts = new Set();
  for (let i = 0; i < 100; i++) firsts.add(rank([newcomer, established], { ...ctx, rotationKey: String(i) })[0].id);
  assert.equal(firsts.size, 2);
  assert.ok(!rank([newcomer], ctx)[0].matchReasons.some(reason => /rated|reviews/.test(reason)));
});
test('the score for one sitter does not inflate when other results disappear', () => {
  const a = sitter('a'), b = sitter('b', { rating: 2, reviews: 1, distance: 25 });
  const before = rank([a, b], ctx).find(s => s.id === 'b').matchScore;
  assert.equal(rank([b], ctx)[0].matchScore, before);
  assert.notEqual(before, 92);
});
test('missing distances and invalid activity dates stay neutral and never produce NaN', () => {
  const result = rank([sitter('missing', { distance: undefined, lastUpdate: 'invalid' })], ctx)[0];
  assert.equal(result._matchBreakdown.distance.feature, 0.5);
  assert.equal(result._matchBreakdown.recency.feature, 0.5);
  assert.ok(Number.isFinite(result.matchScore));
});
