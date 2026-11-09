# Pals and wallet TestFlight — 9 November 2026

## Included
- Six home shortcuts: Add a Pet, Scan QR, Bookings, Chat, Pals, Smart Tags. Referral remains in More.
- Compact sitter switch; clean light Find pet care / Offer pet care cards. AI matching caption in Find pet care, static paw coin beside Barter your time.
- Pals title, broad activities and custom interests, optional date choices, city search / Near me and movable map. Location only requested after a deliberate action, rounded to an area, not stored or shared.
- Pals remains a sample-only prototype. No real people, invites, chats, ID badges or monitored reports.
- Wallet orbit plays once; Reduce Motion disables movement. Earned modal bounces up/down once, silent, for newly observed server EARN transactions after baseline. Actual positive amount only; first wallet visit does not celebrate old ledger history.
- Optional App Store update reminder with Update/Later, three-day reminder spacing, offline fail-open. Short What's new once for this release per member. No update pushes.
- Inherits automatic contextual rating-based matching with safe fallback from the learned-matching branch; backend PR still requires deployment before learning data is available.

## Still required before Pals public launch
- Persisted opt-in profiles, approximate discovery/counts, requests, mutual acceptance and chats.
- 18+ eligibility, identity verification before arranging meetups; verified badge only after actual check.
- Backend report/block and moderation queue, rate limits, availability expiry.
- Public venue reminders, trusted-contact plan sharing. Verification is not a safety guarantee.
- Exact locations/booking addresses must never be published.

## Next build agreed fixes
- Release notice: replace visible literal newline escapes with real paragraphs and plain member-facing wording. Source fixed after build 19.1; not yet uploaded.
- SMS verification: move from four to six digits, coordinating the app input and backend/provider configuration. Verify expiry, limited attempts, resend cooldown and successful real-device verification before marking complete. Pending implementation; do not claim the current build has six-digit verification.
- Pals discovery: replace permanent sample-city shortcuts with Near me, search any city/area and recent searches; retain honest preview labels until real discovery is connected.
- Pals registration remains pending: use the existing OkTreat account with an opt-in profile, interests/languages, approximate area and local/visitor status; eligibility and identity checks must be enforced before real meetup requests.

## Other priorities preserved
- eSIM next; insurance requires partners; pet camera exploration; WhatsApp remains separate.
- Broad real-member Pals map must not be advertised as live from this sample build.

## Source changes after build 20.1 (not yet uploaded)
- Separate local Pals gallery: up to five photos, camera/library, main-photo selection, replacement and removal.
- Pals identity action reuses server-confirmed ID/selfie flow. Gallery photo matching remains unconnected and unverified.
- German added; phone language remains default, manual selection wins, foreground refresh picks up device preference changes. No IP selection.
- French/Japanese/German fixed copy for new Pals and release-notice screens; German core and existing registered-copy translations. Language and currency stay independent.
- 13 targeted locale/translation/Pals checks passed. Device layout review and next signed build pending.
