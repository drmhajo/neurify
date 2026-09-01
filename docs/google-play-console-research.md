# Google Play Console Research Notes — Neurify

Research date: 2026-09-01

| Topic | Official finding | Source |
|---|---|---|
| App creation | Play Console requires the default language, app name, app/game choice, free/paid choice, support email, policy and export-law acknowledgements, and Play App Signing terms. Google Play accepts an Android App Bundle and generates optimized APKs. | [Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en) |
| Data safety | Published apps must provide complete, accurate declarations for app and third-party SDK data handling. Internal-test-only apps are exempt from the Data safety section, but closed, open, and production tracks are not. | [Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en) |
| Sensitive data | Health, account, device, and authentication data are personal or sensitive data. Policies require limited collection, secure transit, accurate disclosure, a privacy policy, and account-deletion access where users can create accounts. Third-party AI use remains the developer's responsibility. | [User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en) |
| Health apps | Health apps must complete the Health apps declaration and provide a publicly accessible, non-PDF, non-geofenced privacy-policy URL. Non-medical-device health apps must state that they are not a medical device and do not diagnose, treat, cure, or prevent conditions. Government-affiliated apps may need eligibility proof through the Advance Notice Form. | [Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en) |
