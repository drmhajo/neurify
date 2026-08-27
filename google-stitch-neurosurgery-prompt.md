# Google Stitch Prompt — Neurosurgery Department App

> **Use this prompt in English in Google Stitch. Upload the department logo separately as the visual reference image.**

```text
Design a premium internal mobile application for the Neurosurgery Department at King Saud Medical City. The product is called “Neurosurgery Department”. It is an operational clinical coordination tool for doctors and nurses, not a public patient portal. Create high-fidelity, connected mobile UI screens in iOS portrait orientation (9:16) with a polished first-party iOS feel.

Brand and visual direction:
- Use the uploaded Neurosurgery Department / King Saud Medical City logo as the app icon, splash identity, and small header mark. Do not redraw or distort the logo.
- The visual language should be calm, precise, clinical, and professional: deep medical navy #123D63, surgical teal #08766D, restrained gold #B97922, very light blue-gray canvas #F3F7FB, white cards, dark navy text, and soft slate secondary text.
- Use rounded cards (16–20 px), subtle 1 px borders, very soft shadows, ample breathing space, compact medical icons, and clear hierarchy. Avoid neon colors, excessive gradients, glassmorphism, playful illustrations, or generic fitness-app styling.
- Arabic is the default language. The interface must be fully bilingual Arabic/English, with correct RTL/LTR layout mirroring, labels, arrows, alignment, and navigation. Show Arabic examples first and English equivalents where useful.
- Follow Apple Human Interface Guidelines: readable type scale, 44 px minimum touch targets, native tab bar, sheets for short forms and selection, useful empty states, clear destructive-action confirmation, and subtle loading/progress feedback.

Create the following connected screens and flows:

1. Splash and sign-in
- Splash screen with the uploaded logo centered on the light blue-gray canvas.
- Sign-in screen with the logo, department title in Arabic and English, username and password fields, a sign-in button, and a language switcher. Make this an internal staff access screen.

2. Home dashboard
- Personalized greeting: “صباح الخير، د. أحمد” / “Good morning, Dr. Ahmed”.
- A compact date and current on-call team strip.
- Primary quick action: “استشارة جديدة” / “New consultation”.
- Status summary cards: new consultations, admitted patients, scheduled surgeries, unread notifications.
- A short activity feed showing recent case, admission, discharge, or team updates.
- Bottom tabs: Home, Teams, Schedule, Reports, Profile.

3. New consultation flow
- A simple clinical intake form with patient MRN, full name, age, responsible team, clinical summary, investigations, diagnosis, and clinical decision.
- Make “Responsible team” a searchable selection sheet.
- Decision segmented control: consultation follow-up, admission, discharge, surgical intervention.
- When surgical intervention is chosen, reveal “Procedure type” as a searchable standardized list of common neurosurgery procedures plus “Other procedure” with a free-text field.
- Show a clear confirmation state explaining whether the patient will move to consultations, admissions, or discharged archive.

4. Treatment teams
- List of medical teams with team name, attending consultant, member avatars/initials, active patient count, and status.
- Team room screen with tabs for Consultations, Admitted patients, Discharged archive, and Team notices.
- Add an internal notification indicator for new consultations and new admissions.

5. Patient medical record
- Patient header with name, MRN, age, status badge, responsible team, and key alerts.
- Sections for medical history, clinical examinations, diagnosis, imaging, scheduled surgeries, timeline/activity, and team chat.
- Imaging attachments should appear as secure file cards with view and download actions.
- Team chat should support text, files, image, and video attachment cards; use fictional demo patient content only.
- Include a protected “Discharge patient” action that moves the patient to the discharged archive after confirmation.

6. Schedule and operating room
- Weekly on-call roster with team and staff assignments.
- Surgery schedule with date, time, patient, procedure type, surgeon, operating room, notes, and status (scheduled, completed, postponed, cancelled).
- Add-surgery form should select an admitted patient first and populate the patient information automatically.
- Use the standardized neurosurgery procedure list to support reliable later analytics.

7. Daily on-call endorsement report
- Screen titled “تقرير تسليم المناوبة” / “Daily On-call Endorsement”.
- Prominent shift window: 07:30 to 07:20 next day, Asia/Riyadh.
- Three separate searchable selection fields: 1st on-call, 2nd on-call, and 3rd on-call. Each field shows active registered users only.
- Report summary sections: consultations, admissions, emergency surgeries, follow-up items, and important notes.
- Actions: preview, download PDF, export Excel, and open “Oncall Endorsement archive”.
- During loading or export, show a calm logo-based loading overlay with the uploaded logo gently pulsing and rotating, plus Arabic/English status text such as “جارٍ تجهيز التقرير…” / “Preparing report…”.

8. Oncall Endorsement archive
- Filterable archive of previous daily reports by date and prepared-by doctor.
- Each report card shows date, preparer, key metrics, on-call team, view action, and download-again action.
- Use a bottom sheet for report detail.

9. Monthly insights dashboard
- Month picker at the top.
- KPI cards generated only from archived on-call reports: consultations, admissions, emergency surgeries, and follow-up cases.
- Daily bar chart with an accessible legend and detailed daily breakdown list.
- Export buttons for PDF and Excel.
- A confident empty state for months with no archived reports: no invented numbers or placeholder analytics.

10. Notifications, profile, and administration
- Notifications inbox with filters for unread, team, report, and schedule events.
- Profile screen with user name, role, department, language selection, change password, help center, user guide, and sign out.
- Admin-only user management screen: active users, roles, permissions, add user, protected removal, and reset temporary password. Never show secrets or API keys in the UI.
- Admin-only backup and cloud sync status card: Local first, Supabase sync status, last synced time, version, and a manual sync control. Use reassuring privacy-oriented copy.

Design realistic empty, loading, success, error, offline, and permission-denied states. Use fictional, non-identifiable patient information only. Create a cohesive clickable prototype: Home → New consultation → Team room → Patient record; Home → Daily endorsement → Archive → Monthly insights; Profile → Admin management. Prioritize usability for busy clinical staff and one-handed use over decorative effects.
```

## Optional refinement prompts

After the first Stitch result, use one refinement at a time:

1. `Make the Arabic RTL layout the primary default. Mirror every navigation chevron, label alignment, and card hierarchy correctly while retaining a complete English LTR mode.`
2. `Reduce visual density in the clinical forms. Use progressive disclosure, selection sheets, and grouped sections so on-call doctors can complete a new consultation quickly with one hand.`
3. `Refine the Monthly Insights screen into a calm executive clinical dashboard. Keep data cards and charts sourced from archived reports only; do not invent metrics.`
