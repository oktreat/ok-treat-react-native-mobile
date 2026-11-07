# Profile cover editing

Your Profile has an accessible camera/Edit cover button on the banner. The editor
uses the system photo library, a 2:1 preview, directional position controls and zoom.
Cancel does not save. Save uploads once, applies the chosen original-pixel crop via
Cloudinary, verifies that the image loads, then updates `/sitter/profile/cover`.
Retries reuse the upload. Failed saves preserve the existing banner and editor draft.
No new native dependency or credential is needed.

The backend atomically merges only `coverPhoto` and its legacy `coverImage` alias
into the authenticated sitter's PHOTOS settings. Avatar/gallery fields and section
completion status stay unchanged. Profile enrichment reads the canonical coverPhoto,
including when PHOTOS is not yet completed. Existing cover-photo uploads in the
registration Photos screen now resolve correctly too.

Validation: crop bounds/aspect across portrait/landscape sizes and zoom/positions;
cancel, successful save and failed save; authenticated backend ownership, URL validation,
atomic update scope and profile enrichment. Real-device photo selection, preview,
upload and persistence after reopening still need confirmation in TestFlight.
