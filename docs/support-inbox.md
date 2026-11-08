# Native support inbox

Support now uses the authenticated `/api/support/cases` backend API instead of
personal phone/WhatsApp links. Customers submit a category, subject and message,
return to My support requests, read public replies and reply inside OkTreat.
`SUPPORT_REPLY` push and notification-centre taps open the matching case.

Requires the backend support integration and encrypted runtime credentials documented
in the backend's `docs/support-inbox.md`. Before those are configured the screen
shows a recoverable connection error and email fallback. No Chatwoot staff token is
bundled in the app. Text submission is supported; agent attachments can be opened.

The report form discloses Chatwoot hosting of name, email and submitted messages.
Support is asynchronous, safety reports are prioritised, and urgent emergencies are
directed to local emergency services or veterinary care. Existing missing-pet alerts
remain available from the pet profile.

Validation: `node --test tests/support-inbox.cjs` plus the existing notification,
registration, bundled chime and navigation regressions. Real phone testing is still
required after backend configuration: submit → Careteam phone push → agent reply →
customer background push → tap through → customer reply, plus private-note exclusion.
