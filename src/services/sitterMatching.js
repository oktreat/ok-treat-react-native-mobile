/**
 * Context-aware sitter ranking with rotation among similarly suitable sitters.
 *
 * Pure JavaScript, runs entirely on device (no API calls).
 * Score = Σ weight_i * normalizedFeature_i, where weights shift based on
 * the user's pet profile and stated preferences.
 *
 * Each ranked sitter also gets an internal `matchScore` (0–100 points, not a probability) and a short
 * `matchReasons[]` list of human-readable explanations of why the sitter
 * scored high on this user's specific criteria.
 */

// ---------------------------------------------------------------------------
// Feature normalization helpers
// ---------------------------------------------------------------------------

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));

// Rating normalized 0..1 (rating range is 0..5)
const ratingNorm = (rating) => clamp((rating || 0) / 5);

// Distance: 0km = 1.0, falls to 0.0 by maxDistance km. Linear decay.
const distanceNorm = (distance, maxDistance = 30) => Number.isFinite(distance) && distance >= 0 ? clamp(1 - distance / maxDistance) : 0.5;

// Trust signal — log-scaled review count, capped at ~200 reviews.
const reviewsNorm = (reviews) => clamp(Math.log10((reviews || 0) + 1) / Math.log10(201));

// Experience: 0–15 years range.
const experienceNorm = (years) => {
  const y = parseInt(years, 10);
  return clamp((isNaN(y) ? 0 : y) / 15);
};

// Completed bookings — log-scaled, capped at 300.
const completedNorm = (n) => clamp(Math.log10((n || 0) + 1) / Math.log10(301));

// Last update recency: 0 days ago = 1.0, 90+ days = 0.0
const recencyNorm = (lastUpdate) => {
  if (!lastUpdate) return 0.5;
  const timestamp = new Date(lastUpdate).getTime();
  if (!Number.isFinite(timestamp)) return 0.5;
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  return clamp(1 - days / 90);
};

// Price fit — peaks at the user's preferred budget; falls off in both directions.
// budget = expected coins for this service. If unknown, use a flat 0.5.
const priceFit = (rate, budget) => {
  if (!budget || !rate) return 0.5;
  const ratio = rate / budget;
  if (ratio <= 1) return 1 - 0.4 * (1 - ratio); // 1.0 at exact budget, 0.6 at free
  return clamp(1 - (ratio - 1) * 1.2); // 0.0 by 1.83x budget
};

// ---------------------------------------------------------------------------
// Pet-fit compatibility (sitter ↔ pet profile)
// ---------------------------------------------------------------------------

const sizeBucket = (weight) => {
  const w = parseFloat(weight);
  if (!w || isNaN(w)) return null;
  if (w < 10) return 'Small';
  if (w < 25) return 'Medium';
  if (w < 45) return 'Large';
  return 'Giant';
};

const petTypeMatches = (sitterPetTypes, petType) => {
  if (!petType || !Array.isArray(sitterPetTypes)) return false;
  const p = petType.toLowerCase();
  return sitterPetTypes.some((t) => String(t).toLowerCase().includes(p));
};

/**
 * petMatchScore — how well the sitter accommodates this specific pet.
 * 0 = no match, 1 = ideal.
 */
function petMatchScore(sitter, pet, serviceSettings) {
  if (!pet) return 0.5;
  let score = 0;
  let max = 0;

  // Pet type compatibility (biggest signal)
  max += 0.4;
  const acceptedTypes = serviceSettings?.petPreferences || sitter.pets || [];
  if (!acceptedTypes.length) score += 0.2;
  else if (petTypeMatches(acceptedTypes, pet.type)) score += 0.4;

  // Size compatibility
  max += 0.25;
  const acceptedSizes = serviceSettings?.petSizePreference || [];
  const petSize = sizeBucket(pet.weight);
  if (petSize && acceptedSizes.includes(petSize)) {
    score += 0.25;
  } else if (acceptedSizes.length === 0) {
    score += 0.125; // neutral if sitter didn't specify
  }

  // Senior pet → bonus for experienced/skilled sitters
  if (pet.ageYears >= 8) {
    max += 0.15;
    const skills = sitter.skills || [];
    const hasSeniorSkill = skills.some((s) =>
      /senior|geriatric|elder/i.test(String(s))
    );
    const exp = parseInt(sitter.yearsOfExperience, 10) || 0;
    if (hasSeniorSkill || exp >= 5) score += 0.15;
    else if (exp >= 3) score += 0.075;
  }

  // High-energy / large pet → yard preference
  if (pet.weight && pet.weight >= 25) {
    max += 0.1;
    if (sitter.yardType === 'Fenced') score += 0.1;
    else if (sitter.yardType === 'Open') score += 0.06;
  }

  // Medication needs → experience + first-aid skills
  if (pet.medications?.length || pet.specialNeeds) {
    max += 0.1;
    const skills = sitter.skills || [];
    const hasMedSkill = skills.some((s) => /first.aid|medication|medical/i.test(String(s)));
    if (hasMedSkill) score += 0.1;
    else if ((parseInt(sitter.yearsOfExperience, 10) || 0) >= 5) score += 0.06;
  }

  return max > 0 ? score / max : 0.5;
}

// ---------------------------------------------------------------------------
// Context-aware weight derivation
// ---------------------------------------------------------------------------

/**
 * Default weights — adjusted up/down based on pet profile + user preferences.
 * Final weights are normalized to sum to 1.0.
 */
function deriveWeights(pet, user) {
  const w = {
    rating: 0.18,
    distance: 0.20,
    reviews: 0.05,
    price: 0.10,
    experience: 0.08,
    petMatch: 0.29,
    recency: 0.05,
    completed: 0.05,
  };

  if (pet) {
    // Senior pet → experience matters more
    if (pet.ageYears >= 8) {
      w.experience += 0.10;
      w.rating += 0.04;
    }
    // Young/puppy → experience also helps (but less critical)
    if (pet.ageYears && pet.ageYears <= 1) {
      w.experience += 0.05;
      w.petMatch += 0.05;
    }
    // Large pet → pet-match (home/yard fit) critical
    if (pet.weight && pet.weight >= 25) {
      w.petMatch += 0.10;
    }
    // Medical needs → experience + reviews
    if (pet.medications?.length || pet.specialNeeds) {
      w.experience += 0.15;
      w.reviews += 0.05;
    }
  }

  if (user) {
    // Explicit user preferences (if/when we surface a budget filter)
    if (user.budgetSensitivity === 'low') w.price += 0.15;
    if (user.budgetSensitivity === 'high') w.price -= 0.05;
    if (user.firstTimeUser) w.rating += 0.05; // first-timers value trust more
  }

  // Normalize so weights sum to 1.0
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => (w[k] = w[k] / total));
  return w;
}

// ---------------------------------------------------------------------------
// Score one sitter — returns { score, breakdown }
// ---------------------------------------------------------------------------

function scoreSitter(sitter, ctx, weights) {
  const { pet, serviceType, userBudget, maxDistance = 30 } = ctx;
  const serviceSettings = sitter.services?.[serviceType] || sitter.serviceSettings || {};
  const rate = serviceSettings.baseRate ?? sitter.coins ?? 0;

  const features = {
    // Shrink unproven ratings toward a neutral prior; no reviews is not 5 stars.
    rating: clamp(((sitter.reviews || 0) * ratingNorm(sitter.rating) + 5 * 0.7) / ((sitter.reviews || 0) + 5)),
    distance: distanceNorm(sitter.distance, maxDistance),
    reviews: 0.5 + 0.5 * reviewsNorm(sitter.reviews),
    price: priceFit(rate, userBudget),
    experience: experienceNorm(sitter.yearsOfExperience),
    petMatch: petMatchScore(sitter, pet, serviceSettings),
    recency: recencyNorm(sitter.lastUpdate),
    // Do not use repeatClients: the current API derives it from a booking estimate.
    completed: 0.5 + 0.5 * completedNorm(sitter.completedBookings || 0),
  };

  let score = 0;
  const breakdown = {};
  Object.keys(weights).forEach((k) => {
    const contribution = weights[k] * features[k];
    breakdown[k] = { weight: weights[k], feature: features[k], contribution };
    score += contribution;
  });

  return { score, breakdown, features };
}

// ---------------------------------------------------------------------------
// Why-this-match generator
// ---------------------------------------------------------------------------

function buildReasons(sitter, ctx, breakdown, features) {
  const reasons = [];
  const { pet, serviceType } = ctx;

  // Pick the top 3 features that contributed most to the score
  const ranked = Object.entries(breakdown)
    .map(([k, v]) => ({ key: k, contribution: v.contribution, feature: v.feature }))
    .sort((a, b) => b.contribution - a.contribution);

  const top = ranked.filter((r) => r.feature > 0.6).slice(0, 3);

  for (const r of top) {
    switch (r.key) {
      case 'rating':
        if (!(sitter.reviews >= 3)) break;
        if (sitter.rating >= 4.8) reasons.push(`Top-rated (${sitter.rating}★)`);
        else if (sitter.rating >= 4.5) reasons.push(`Highly rated (${sitter.rating}★)`);
        break;
      case 'distance':
        if (sitter.distance <= 5) reasons.push(`Close to you (${sitter.distance} km)`);
        break;
      case 'reviews':
        if (sitter.reviews >= 100) reasons.push(`${sitter.reviews}+ reviews`);
        else if (sitter.reviews >= 30) reasons.push(`Well-reviewed (${sitter.reviews})`);
        break;
      case 'price':
        if (ctx.userBudget && features.price >= 0.85) reasons.push(`Within your budget`);
        break;
      case 'experience':
        const exp = parseInt(sitter.yearsOfExperience, 10);
        if (exp >= 8) reasons.push(`${exp}+ years experience`);
        else if (exp >= 4) reasons.push(`Experienced (${exp}y)`);
        break;
      case 'petMatch':
        if (pet?.type) {
          const acceptedTypes = sitter.services?.[serviceType]?.petPreferences || sitter.pets || [];
          if (petTypeMatches(acceptedTypes, pet.type)) reasons.push(`Accepts ${pet.type}s`);
        }
        if (pet?.weight >= 25 && sitter.yardType === 'Fenced') reasons.push(`Fenced yard for large pets`);
        if (pet?.ageYears >= 8 && (parseInt(sitter.yearsOfExperience, 10) || 0) >= 5) {
          reasons.push(`Good for senior pets`);
        }
        break;
      case 'recency':
        if (features.recency >= 0.9) reasons.push(`Recently active`);
        break;
      case 'completed':
        if (sitter.completedBookings >= 50) reasons.push(`${sitter.completedBookings}+ completed bookings`);
        break;
    }
  }

  // De-dupe and cap at 3
  return Array.from(new Set(reasons)).slice(0, 3);
}

// ---------------------------------------------------------------------------
// PUBLIC: rankSitters
// ---------------------------------------------------------------------------

/**
 * Rank sitters by match quality.
 *
 * @param {Array} sitters - raw sitter list from /api/sitter/search
 * @param {Object} ctx - context:
 *   - pet: { type, breed, weight, ageYears, medications, specialNeeds, energyLevel }
 *   - user: { budgetSensitivity, firstTimeUser }
 *   - serviceType: string (enum value e.g. 'PET_WALKING')
 *   - userBudget?: number (coins) - if known
 *   - maxDistance?: number (km), default 30
 *   - rotationKey?: stable per-search key; new searches rotate similar candidates
 * @returns {Array} sitters with extra fields:
 *   - matchScore: 0..100 internal points, never displayed as a compatibility percentage
 *   - matchReasons: string[]
 *   - _matchBreakdown: object (for debugging)
 */
export function rankSitters(sitters, ctx = {}) {
  if (!Array.isArray(sitters) || sitters.length === 0) return [];

  const weights = deriveWeights(ctx.pet, ctx.user);

  // Score everyone
  const scored = sitters.map((s) => {
    const { score: baseScore, breakdown, features } = scoreSitter(s, ctx, weights);
    const learned = ctx.feedbackBySitter?.[s.id];
    const validFeedback = learned?.version === 'booking-feedback-bayes-v1' &&
      ['your-completed-booking-reviews', 'completed-booking-reviews'].includes(learned.source) &&
      typeof learned.adjustment === 'number' && Number.isFinite(learned.adjustment);
    const adjustment = validFeedback ? clamp(learned.adjustment, -0.04, 0.04) : 0;
    const score = clamp(baseScore + adjustment);
    const reasons = buildReasons(s, ctx, breakdown, features);
    if (adjustment > 0.005) reasons.unshift(learned.source === 'your-completed-booking-reviews'
      ? 'Based on your completed-booking reviews' : 'Supported by completed-booking reviews');
    return { sitter: s, score, breakdown, features, reasons: reasons.slice(0, 3) };
  });

  // Bookable sitters and known pet compatibility always take priority.
  // Rotate only candidates within five actual score points of the band's best.
  // Anchoring each band prevents a chain of near-ties mixing distant scores.
  const key = String(ctx.rotationKey ?? Math.random());
  const hash = value => { let h = 2166136261; for (const c of value) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const group = sitter => {
    const settings = sitter.services?.[ctx.serviceType] || sitter.serviceSettings || {};
    const types = settings.petPreferences || sitter.pets || [];
    const sizes = settings.petSizePreference || [];
    const size = sizeBucket(ctx.pet?.weight);
    const mismatch = !!(ctx.pet && ((types.length && ctx.pet.type && !petTypeMatches(types, ctx.pet.type)) || (size && sizes.length && !sizes.includes(size))));
    return (sitter.approvalStatus === 'APPROVED' && sitter.availableForBooking !== false ? 0 : 2) + (mismatch ? 1 : 0);
  };
  scored.forEach(item => { item.group = group(item.sitter); });
  scored.sort((a, b) => a.group - b.group || b.score - a.score || String(a.sitter.id).localeCompare(String(b.sitter.id)));
  const ordered = [];
  for (let start = 0; start < scored.length;) {
    let end = start + 1;
    while (end < scored.length && scored[end].group === scored[start].group && scored[start].score - scored[end].score <= 0.05) end++;
    const band = scored.slice(start, end).sort((a, b) => String(a.sitter.id).localeCompare(String(b.sitter.id)));
    const offset = hash(key + ':' + band.map(item => item.sitter.id).join(',')) % band.length;
    ordered.push(...band.slice(offset), ...band.slice(0, offset));
    start = end;
  }
  return ordered.map(({ sitter, score, breakdown, reasons, group: eligibilityGroup }) => ({
    ...sitter,
    matchScore: Math.round(score * 100),
    matchEligible: eligibilityGroup === 0,
    matchReasons: reasons,
    _matchBreakdown: breakdown,
  }));
}

/**
 * For debugging / one-off use — score a single sitter explicitly.
 */
export function scoreOne(sitter, ctx) {
  const weights = deriveWeights(ctx.pet, ctx.user);
  return scoreSitter(sitter, ctx, weights);
}

