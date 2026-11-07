# iPhone notification sound diagnostic

This is an experiment, not a confirmed fix. The TestFlight workflow enables
`EXPO_PUBLIC_PUSH_DIAGNOSTICS=true`; ordinary builds leave it unset.

In Profile → Notification Preferences, open **Notification sound test**.
The separate `expo-av` socket chime is disabled on iPhone in this build, so
foreground native push sound and locked-screen push sound can be tested without
the chime changing the audio session. Android behavior is unchanged.

1. Schedule the ten-second local sound test, return Home, and lock the phone.
2. Note whether the local alert appears and sounds.
3. Send three remote messages from the other account, one minute apart, without
   opening this app between messages. Note appearance and sound for each.
4. Return to the diagnostic screen and Refresh details. Capture the report.

The report includes iOS notification sound permission, sanitized sound metadata
from received/opened notifications, and up to ten notifications still presented
in Notification Centre. JavaScript does not run for every locked-screen alert:
presented notifications are inspected on refresh, and tapped notifications on
open. It cannot tell whether iOS actually played a sound. Missing metadata is
labelled “not exposed”, not treated as proof of a silent payload.

Only the last twenty received/opened metadata records are kept locally.
No message text, full payload, account IDs, device tokens, or credentials are
stored by this diagnostic or sent to a server. This does not bypass Silent Mode,
Focus, user settings, or Apple system behavior. Restore the in-app chime and
remove the diagnostic build flag after the comparison.
