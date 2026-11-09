# PALS stages 1–3 — 10 November 2026

PALS keeps its original focus: single dog owners travelling to meet new friends.

The Bonding navigation entry now opens PalsLiveScreen. This uses the existing OkTreat authentication token with the new `/api/pals` service, rather than local sample profiles. Existing preview components remain available in source for regression reference; they are not the navigation destination.

Implemented: separate opt-in profile and owned-dog selector; private-first consent; up to five personal photos resized and re-encoded on device; main-photo selection/removal; saved destination/date travel plans; overlapping travel discovery and optional interest/language filters; activity invitations and recipient acceptance/decline; persistent accepted-only conversations; block/report; hide/delete; closed connections and travel cancellation.

Identity remains server-authoritative. Both participants need live Stripe Identity verification before inviting, accepting or chatting. PALS does not claim that gallery photos match an identity selfie. The existing admin identity mode is preserved; test-mode checks do not count. Basic new copy is provided in French/Japanese/German, while server error text may remain English.

Dependency: SDK-compatible expo-image-manipulator `~14.0.8`, with package lock updated. A new native app build is required. This source branch does not replace the submitted App Store build or upload a TestFlight binary automatically. The CI workflow builds iOS/Android JS bundles and compiles iOS for the simulator without signing credentials.

Backend dependency: oktreat/ok-treat-backend-patrick PR #20. Website companion: oktreat/oktreat-website PR #4. Production deployment, native device acceptance and signed TestFlight upload remain release steps. Automatic approval rejected the production backend main update; no production PALS member fixtures were created.

Limits: normalized exact City, Country matching rather than geocoding; foreground polling rather than PALS background push; capped DB photo storage for the pilot. Gallery/selfie matching, AI recommendations, eSIMs, insurance and PALS Plus are not represented as implemented.
