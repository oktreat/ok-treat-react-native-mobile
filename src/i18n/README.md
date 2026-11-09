# App language selection

- Default `system` uses the phone's ordered preferred languages, never IP or location.
- English (US/UK), Japanese, French, German and the existing Chinese core bundle are registered.
- A saved supported language overrides the phone. Unsupported phone languages fall back to English.
- App foregrounding reapplies saved/system language to pick up device preference changes.
- Currency is independent of display language.
- Core keys and registered fixed-copy strings have French, Japanese and German translations, including Pals profile/photos/identity preview, discovery and release notice.
- Member-written introductions, custom interests, names and chat are never automatically translated.
- Other hardcoded text may still fall back to English; registered-key coverage does not mean every screen is migrated. Native-device layout review is required.

Use `useTranslation()` with keyed resources or `copy()` with fixed natural-language copy and `useCopyUpdates()` for language updates. Never translate API enum values or member-written content. Keep interpolation placeholders identical in all language resources.
