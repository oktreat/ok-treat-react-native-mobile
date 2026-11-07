# Native build checks

The GitHub Actions workflow compiles the existing native projects, without
requiring a local Mac. It uses the checked-in dependency locks and existing
Stripe patch. No Expo account, EAS service, Apple credentials or Google Play
credentials are used.

- Android: notification tests, production JS export, and arm64 debug APK
  compilation. The debug APK normally needs Metro and is not a standalone
  release or Play upload. The JS export is a separate bundling check.
- iOS: Release-mode simulator compilation with code signing disabled. The
  simulator app is not installable on a physical iPhone or uploadable to Apple.

These checks run on PRs targeting develop/main. The manual dispatch becomes
available after the workflow is merged to the default branch. Build diagnostics
are retained for three days. Successful compilation is not a device test.

## Release requirements after successful compilation

1. Complete staging backend/referral tests before enabling the new policy for
   production users. Deploy the backend/admin/mobile as a coordinated release.
2. Obtain authorized signing access. iOS Release currently names the previous
   local signing certificate/profile; those private signing assets are not in
   this repository. The simulator check deliberately does not use them.
3. Android store builds require the existing upload keystore (or an authorized
   Play upload-key reset). Do not distribute a debug-signed artifact as a release.
4. Confirm the next unused store version/build numbers in both consoles before
   preparing signed archives. Checked-in app/native version values differ.
5. Build a signed TestFlight/internal-testing version and test notifications
   open/background/locked, referral credit timing and booking/wallet behavior.
6. Submit tested signed artifacts to the existing store listings. This workflow
   never submits, publishes, changes store settings or alters release signing.

Store-account access alone does not create signing keys or a native build.
Xcode Cloud's initial setup also requires its project onboarding; merely
accepting the Apple program agreement does not create a workflow there.
