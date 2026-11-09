# Review-based sitter recommendation learning

The app and website use contextual Bayesian outcome learning alongside the existing explainable suitability score. This is a statistical recommendation model, not an LLM, and it does not infer care skills from written reviews.

## Data and training

The authenticated endpoint verifies that the selected pet belongs to the requesting owner. It considers up to 1,000 recent COMPLETED bookings for the same service and pet type, and their latest linked star ratings. It validates booking/reviewer/sitter consistency, deduplicates booking reviews, excludes self-reviews and limits each owner's influence to three outcomes per sitter. No review text, medical notes, addresses or customer identities are sent to an outside AI service or returned by the endpoint.

A four-star prior is regularised with four observations for personal outcomes and eight for community outcomes. Personal learning requires two reviewed bookings; community learning requires at least three reviewed bookings across two other owners. When both qualify, personal and community estimates are blended 70/30. The learned adjustment is capped at +/- four ranking points. A new or deleted review changes the next model fetch; there is no long-lived model cache.

## Controls and fairness

Users can turn review-based learning off. Empty/insufficient history and endpoint failures preserve the base suitability ranking. The app and website reject feedback for a previous pet/service/user context. Learning never overrides the existing eligibility groups; equally suitable sitters still rotate within five-point bands. An identity-check badge is separate from skill or compatibility.

## Connected gaps

Search responses now include completed-booking counts. An optional TreatCoin budget is passed to the ranker; it is a ranking preference, not a hard price limit. Website users can choose which pet drives matching.

## Remaining limitations

No claim of measured improvement on real-world outcomes has been established. The model learns sitter outcome estimates within pet-type/service contexts, not causal pet-care skill or general preferences for all possible sitters. New sitters use the existing cold-start ranking. Star-rating selection bias remains. Availability currently checks weekdays/time windows, not simultaneous booking capacity; capacity-aware conflict enforcement needs a separate booking-flow change. Temperament, children, resident pets and energy-level compatibility are not newly implemented here. User-facing claims must not promise the best sitter, guaranteed compatibility or full availability.

## Validation

Backend tests cover model updates, sparse data, fraud/duplicate exclusions, independence thresholds, deleted reviews, access control, context scoping and non-leaking failures. Client tests cover learned score changes, untrusted model validation, hard eligibility priority and continued rotation. Existing fairness tests and production JavaScript/web builds also run in CI. A production acceptance test with consented completed-booking feedback is still required to establish recommendation quality.
