# FCM setup status

Android device confirms notification permission is granted, but obtaining an Expo-hosted push token failed before Supabase registration. Android now uses the native Firebase device token path instead of Expo token acquisition.

The Firebase project **KSMC Neurosurgery Push** was created with optional Gemini and Google Analytics disabled. The Android application `com.app.ksmcneurosurgery` was registered and its `google-services.json` configuration was added to the project root. The app configuration references that file and uses Android version code 3.

The Firebase service-account credential was verified against Google's OAuth endpoint, placed only in the `FIREBASE_SERVICE_ACCOUNT_JSON` secret for the Supabase Edge Function, and removed from the sandbox download area. The function version 6 registers FCM device tokens and sends protected announcements directly with FCM HTTP v1. A live registration test using a synthetic FCM-format token passed and cleaned up its temporary account automatically. A physical Android device must still install the new build before delivery can be confirmed.
