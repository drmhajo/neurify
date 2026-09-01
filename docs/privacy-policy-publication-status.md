# Privacy Policy Publication Status

**Checked:** 1 September 2026

The first external check of `https://neurify.manus.space/privacy` returned `Cannot GET /privacy` after checkpoint `0a9c7d78`. The source code registers `/privacy` and `/account-deletion` in the Express server, and local type, lint, targeted route, and server-build checks passed. The public domain has not yet served the new server bundle, so the URLs must not be pasted into Google Play Console until an external HTTPS check returns HTTP 200.

Next action: restart the managed development service from the saved checkpoint, allow the published service to refresh, then test both public endpoints again without authentication.
