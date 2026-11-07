# Localization and market rollout

Language and payment country are separate. The app follows supported phone languages unless the user chooses a language in Settings. English is the fallback. English supports the US, UK, Australia and other English-speaking markets. French is available for French-speaking Canada and other French-speaking users; Japanese supports the planned Japan rollout. Chinese coverage remains partial.

## Implemented interface coverage

French and Japanese cover the registered Home, navigation, language/settings and TreatCoins keys, plus fixed interface copy on More, Rebook, Your Pets, Services, service search, Bookings, booking details/cancellation, the card payment sheet and support/safety reporting. Messages, names, booking IDs, API enums and exact payment amounts are not translated or changed. Existing monetary prices remain USD; there are no currency-picker buttons on the purchase screen.

The copy namespace contains natural-language interface keys with key/namespace separators disabled. Components subscribe to language changes through useCopyUpdates. English strings remain readable when a resource is missing. New interface strings must be added to the Japanese and French copy catalogues with matching interpolation placeholders.

## Remaining before claiming full-language support

Complete remaining authentication, sitter onboarding/service setup, sitter dashboard, search results, booking creation, pet editing, wallet/history, notifications and legal content. Review wording with fluent speakers and check long French labels and Japanese text on physical devices. The current catalogue is not a claim that the entire app has been localized. User-generated content and server-originated notifications/errors may still be English.

## Independent pending market/payment work

Confirmed account/payment country should govern the actual charge currency, with phone region only suggesting a default and an account correction path. Support additional markets through admin configuration rather than hardcoding three countries. USD, CAD, JPY, AUD, GBP, EUR and later other currencies need actual package price configuration and backend checkout support. Do not change a currency symbol without changing the charge currency. Keep the TreatCoins ledger shared across markets. These payment changes are not yet implemented.

Smart Tags still link to the US Amazon store. No Canadian, Australian or Japanese store listing is implied. Admin referral controls remain on the separate unmerged admin work; distributable promotion codes, eligibility, expiry and redemption limits need implementation and verification before activation.

## Validation

44 app regression tests passed, including translation completeness for registered keys, interpolation preservation, language/region independence, exact USD confirmation totals, support request submission and navigation. Production iOS JavaScript export passed. Physical-device and fluent-language review remain outstanding. The existing TestFlight 2.0.0 (11.1) predates this expanded translation work, the later blue palette and removal of purchase currency controls.
