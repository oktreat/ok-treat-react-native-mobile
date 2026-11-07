# Localization and market rollout

Language and payment country are separate. The app follows supported phone languages unless the user chooses a language in Settings. English is the fallback. English supports the US, UK, Australia and other English-speaking markets. French is available for French-speaking Canada and other French-speaking users; Japanese supports the planned Japan rollout. Chinese coverage remains partial.

## Implemented interface coverage

French and Japanese cover the registered Home, navigation, language/settings and TreatCoins keys, plus fixed interface copy on More, Rebook, Your Pets, Services, service search, Bookings, booking details/cancellation, the card payment sheet and support/safety reporting. Messages, names, booking IDs, API enums and exact payment amounts are not translated or changed. New app purchases use a confirmed payment country and signed local-currency quotes. USD base package prices are converted using cached daily reference FX rates; the exact amount is locked for ten minutes. There are no currency-picker buttons on the purchase screen; the country correction path is in Settings.

The copy namespace contains natural-language interface keys with key/namespace separators disabled. Components subscribe to language changes through useCopyUpdates. English strings remain readable when a resource is missing. New interface strings must be added to the Japanese and French copy catalogues with matching interpolation placeholders.

## Remaining before claiming full-language support

Complete remaining authentication, sitter onboarding/service setup, sitter dashboard, search results, booking creation, pet editing, wallet/history, notifications and legal content. Review wording with fluent speakers and check long French labels and Japanese text on physical devices. The current catalogue is not a claim that the entire app has been localized. User-generated content and server-originated notifications/errors may still be English.

## Country-based payments

Confirmed account/payment country governs the actual charge currency, with phone region suggesting the initial default. USD, CAD, JPY, AUD, GBP and EUR are supported. JPY uses whole yen. Admin USD base prices remain authoritative for conversion. Existing SystemSetting rows store the confirmed country and FX cache; there is no schema migration. Signed quotes bind the user, current package, country, currency, exact minor amount, mode and expiry. Duplicate attempts use the same quote idempotency key. Old clients retain their existing USD behavior. Missing rates, expired quotes or mismatched totals block payment instead of silently reverting to USD. Frankfurter is the primary daily reference-rate source; ExchangeRate-API is the attributed fallback. Neither receives customer information. Physical device/card verification remains required after deployment.

Additional countries can be mapped to enabled currencies via backend market configuration. A full admin UI for country/currency pricing remains future work. User-controlled referral settings and promotional codes are separate pending work and are not included in this currency release.

Smart Tags still link to the US Amazon store. No Canadian, Australian or Japanese store listing is implied. Admin referral controls remain on the separate unmerged admin work; distributable promotion codes, eligibility, expiry and redemption limits need implementation and verification before activation.

## Validation

48 app regression tests passed, including country confirmation and quote display/payload protection, translation completeness for registered keys, interpolation preservation, language/region independence, exact USD confirmation totals, support request submission and navigation. Production iOS JavaScript export passed. Physical-device and fluent-language review remain outstanding. The existing TestFlight 2.0.0 (11.1) predates this expanded translation work, the later blue palette and removal of purchase currency controls.
