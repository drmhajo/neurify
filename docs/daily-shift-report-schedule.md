# Daily Shift Report Schedule

The automatic handover report is designed to run at **07:20 Asia/Riyadh** after the 24-hour shift that starts at 07:30 on the previous report date. The platform scheduler uses UTC, so the required expression is:

```text
0 20 4 * * *
```

The callback path is `/api/scheduled/daily-shift-report`. It reads the protected departmental snapshot, creates one report per report date, adds an internal notification for users with the report-management permission, and saves the updated snapshot. Repeating a trigger for the same date leaves the existing report unchanged.

The project must be published before enabling this schedule. Do not configure it until the user has tested the manual report workflow with only approved demo data.
