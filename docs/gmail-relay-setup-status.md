# Gmail Recovery Relay Setup Status

- The user has provided a Google Apps Script project for the password-recovery mail relay.
- The relay will accept only authenticated requests from the central registration function and will send no clinical or patient data.
- The relay has been published as a public Apps Script web app, protected by a shared server-side token. Its deployment URL is stored only as a server secret.
- The first published version did not include `doPost` because the editor restored the starter function before the draft was saved. The code must be saved and the deployment updated before the relay can accept requests.
- تم إدخال دعم الإجراء المحمي `account_welcome` في محرر Apps Script إلى جانب استعادة كلمة المرور. يلزم الآن حفظ الشيفرة وتحديث نشر خدمة الويب قبل أن تتمكن الوظيفة المركزية من إرسال رسالة الترحيب.
- تم حفظ الشيفرة المحدثة وفتح قائمة النشر لتحديث إصدار خدمة الويب بالمسار الجديد.
- تم تحديث نشر خدمة الويب بنجاح إلى الإصدار 4، ويقبل الآن إجراء `account_welcome` المحمي للرسائل الترحيبية.
- The prior Resend sender was not usable for arbitrary recipients because no verified sender domain was present.
