# AI Medical Report Drafts

Neurify creates an **AI-assisted draft**, not a diagnosis, prescription, prognosis, or final medical report. The draft generator receives only minimized clinical documentation required for the requested sections. It deliberately excludes the patient name, medical-record number, ward, bed, attachments, and internal discussion messages.

The generator uses only documented file fields. When a requested section is unavailable, it must state that the information is not documented. The user must review and edit every section, then explicitly mark the draft as reviewed before the PDF export control is enabled. The exported PDF identifies the approving user and records that it was AI-assisted from documented file data.

The service requires an approved central department session, applies a limit of three requests per user per minute, and does not log clinical request content. It is unavailable for offline, local-only, expired, or unapproved sessions.
