# Report Request Reminder Schedule

The Neurify report-request reminder runs through the platform-managed Heartbeat service, not through an in-process timer. The task sends at most one reminder per incomplete report request per **Riyadh calendar day**. It evaluates only requests created at least three days earlier and stops permanently when a clinician records **Notify completed**.

| Setting | Value |
|---|---|
| Task name | `neurify-report-request-reminders` |
| Task UID | `oJJD8xzjPjw7wMtbardFz5` |
| Callback | `POST /api/scheduled/report-request-reminders` |
| Cron (UTC) | `0 0 6 * * *` |
| Local schedule | 09:00 Asia/Riyadh daily |

The callback accepts only the platform’s authenticated cron identity. It loads the central snapshot, records the Riyadh-day reminder marker before dispatch, and sends a generic notification only to registered devices belonging to the assigned consultant and treating-team members. Push text must never include a patient name, record number, diagnosis, or report title.

To pause or change the task, use its task UID through the project’s schedule management interface or the owner management command. Do not create a second task with the same purpose, as that could duplicate reminders.
