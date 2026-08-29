# Central Department Data Sync

## Goal

Neurify will treat the approved department snapshot in Supabase as the shared source of truth for consultations, admitted and discharged cases, medical-file fields, care teams, schedules, surgeries, report preferences, notifications, and discussion metadata. The mobile device retains a local encrypted/OS-protected working copy for offline viewing and short network interruptions, but it must reconcile against the central version when the user signs in, returns to the app, or edits data.

## Access Model

The client never receives the Supabase service-role credential. It calls the existing `central-registration` Edge Function over HTTPS using the publishable project key and a short-lived signed `dataProof` received only after a successful approved-account sign-in. The function independently checks that the account remains approved before every read or write. Local-only legacy accounts do not receive access to central clinical data.

## Synchronization Contract

The shared snapshot is versioned. A client first pulls the latest snapshot and records its version. Subsequent changes are submitted with that expected version. The Edge Function updates only when the expected version matches the database version; otherwise it returns a conflict response and never replaces central data. The app preserves the unsent local copy under a recovery key, retains the central version as the visible source, and marks the sync state as `conflict` for administrative follow-up.

The application automatically checks the central snapshot after approved sign-in, on return to the foreground, and periodically while the app is active. Changes are queued locally first and then synchronized. If the network is unavailable, the user can keep working on the device; the pending change remains local until a later successful sync.

## Migration Safety

If a central snapshot already exists, it is never overwritten during a new device's first sync. The device saves a local recovery snapshot before adopting the central data. If no central snapshot exists, only the approved central administrator can initialize it from the current device. Attachments and images continue to synchronize their structured metadata; existing device-local file paths are intentionally not uploaded as patient files.

## Audit Design

`department_data_audit` records successful snapshot writes without recording patient names, file numbers, clinical notes, or attachment content. Each record includes the actor account ID, actor display name, resulting snapshot version, event type, and a compact non-clinical change summary. The audit table is readable and writable only by the service role through the Edge Function.

## Limits and Non-Goals

The snapshot is limited to 7.5 MB after device-local attachment paths are removed. This release provides safe shared departmental data with optimistic conflict protection, rather than independent real-time field-level co-editing. Storing or downloading binary clinical attachments across devices requires a separately approved protected file-storage workflow.
