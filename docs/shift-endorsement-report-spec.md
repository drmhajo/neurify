# Shift Endorsement Report Specification

## Source template review

The supplied **KSMC Neurosurgery endorsement sheet** is a two-page daily handover report. It has a header containing the reporting date and the first, second, and third on-call clinicians.

| Section | Required fields captured from the template |
| --- | --- |
| Consultations | AM/PM, MRN, age, diagnosis, consulting specialty, clinical plan, and whether follow-up is required (Yes/No) |
| Admissions | MRN, diagnosis, elective/emergency status, plan, and admitting consultant |
| Emergency surgeries | MRN, diagnosis, and surgery/procedure |

## Shift window

The application will treat the daily handover period as **07:30 on the report date through 07:20 on the following date**. Reporting should be generated only after the closure point, while a manual preview/export remains available to authorized users during the shift.

## Data safety

This template is a clinical operations report. Only approved departmental accounts should access a report containing patient identifiers. The current project remains a pilot and must not receive real patient data until institutional identity, retention, and audit controls are approved.
