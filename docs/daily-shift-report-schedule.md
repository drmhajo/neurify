# Daily Shift Report Schedule

The automatic handover report is designed to run at **07:20 Asia/Riyadh** after the 24-hour shift that starts at 07:30 on the previous report date. The platform scheduler uses UTC, so the required expression is:

```text
0 20 4 * * *
```

The callback path is `/api/scheduled/daily-shift-report`. It reads the protected departmental snapshot, creates one report per report date, adds an internal notification for users with the report-management permission, and saves the updated snapshot. Repeating a trigger for the same date leaves the existing report unchanged.

## Active pilot schedule

| Setting | Value |
| --- | --- |
| Schedule name | `ksmc-daily-shift-endorsement` |
| Schedule task UID | `Ew9itoDgo28nYGXe9wVXPr` |
| Cron expression | `0 20 4 * * *` UTC |
| Local execution time | 07:20 Asia/Riyadh, every day |
| Callback | `POST /api/scheduled/daily-shift-report` |

The project was published before this schedule was enabled. The first production run should be reviewed through the schedule execution history after the next 07:20 Asia/Riyadh trigger. Do not use patient-identifiable data until institutional access, audit, and retention controls are approved.
