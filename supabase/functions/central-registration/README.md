# Central Registration Edge Function

This function exposes the existing registration contract through Supabase HTTPS. It supports `submit`, `sign_in`, `list`, `approve`, and `reject` actions. The app sends the public anon key to the function gateway; the service-role key remains available only inside Supabase.

Before deployment, run `central_registration.sql` in the Supabase SQL Editor and add `REGISTRATION_APPROVAL_SECRET`, `GMAIL_RELAY_URL`, and `GMAIL_RELAY_TOKEN` under Edge Functions → Secrets. The Gmail relay values remain only in Supabase and call the protected Google Apps Script web app to send the 15-minute password-recovery code to approved accounts. Deploy the function with JWT verification enabled.
