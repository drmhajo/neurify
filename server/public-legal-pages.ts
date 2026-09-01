import type { Express } from "express";

const APP_URL = "https://neurify.manus.space";
const KSMC_CONTACT_EMAIL = "info@ksmc.med.sa";

function documentShell(title: string, language: "en" | "ar", body: string) {
  const isArabic = language === "ar";
  return `<!doctype html>
<html lang="${language}" dir="${isArabic ? "rtl" : "ltr"}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index,follow" />
    <title>${title} | Neurify</title>
    <style>
      :root { color-scheme: light; font-family: Arial, "Noto Sans Arabic", sans-serif; color: #17314b; background: #f7f9fb; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f7f9fb; }
      main { width: min(920px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 56px; }
      header { border-bottom: 4px solid #2b8c8c; padding-bottom: 22px; margin-bottom: 28px; }
      .brand { color: #4155a3; font-weight: 800; font-size: 1.05rem; letter-spacing: .04em; }
      h1 { color: #153f66; font-size: clamp(1.8rem, 4vw, 2.5rem); margin: 10px 0 8px; }
      h2 { color: #153f66; font-size: 1.22rem; margin: 28px 0 10px; }
      h3 { color: #153f66; font-size: 1rem; margin: 20px 0 8px; }
      p, li { color: #38556b; font-size: 1rem; line-height: 1.75; }
      ul { padding-inline-start: 24px; }
      a { color: #147f85; font-weight: 700; }
      .notice { background: #eef7f6; border: 1px solid #a9d6d1; border-radius: 12px; padding: 16px 18px; margin: 20px 0; }
      .notice strong { color: #0e6268; }
      .meta { color: #607789; font-size: .92rem; }
      .nav { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 16px; }
      .nav a { text-decoration: none; background: #153f66; color: #fff; padding: 10px 14px; border-radius: 8px; }
      footer { color: #607789; border-top: 1px solid #cfdae2; margin-top: 34px; padding-top: 18px; font-size: .9rem; line-height: 1.6; }
    </style>
  </head>
  <body><main>${body}<footer>Neurify · King Saud Medical City Neurosurgery Department<br />${isArabic ? "للتواصل العام مع مدينة الملك سعود الطبية:" : "Public King Saud Medical City contact:"} <a href="mailto:${KSMC_CONTACT_EMAIL}">${KSMC_CONTACT_EMAIL}</a></footer></main></body>
</html>`;
}

const englishPrivacyPage = documentShell("Privacy Policy", "en", `
  <header><div class="brand">NEURIFY</div><h1>Privacy Policy</h1><p class="meta">Last updated: 1 September 2026</p><div class="nav"><a href="mailto:${KSMC_CONTACT_EMAIL}?subject=Neurify%20privacy%20request">Privacy contact</a></div></header>
  <p>Neurify is a restricted-access clinical coordination application for authorized users of the King Saud Medical City Neurosurgery Department. This policy describes how operational, account, and clinical workflow information is handled when authorized users access Neurify.</p>
  <div class="notice"><strong>Important:</strong> Neurify supports clinical coordination and documentation workflows. It does not provide patient-facing medical advice, diagnosis, triage, or emergency services. Authorized clinicians remain responsible for reviewing all clinical documentation before use, export, or sharing.</div>
  <h2>1. Information handled by Neurify</h2>
  <p>Neurify may handle account and professional information, including a user’s name, approved email address, telephone number, job title, role, team assignment, account approval status, and authenticated device notification token. It may also handle patient-file workflow information entered by authorized users, including demographic and record details, documented clinical information, care-team assignments, report requests, schedules, operational notes, messages, and attachments.</p>
  <h2>2. Why the information is used</h2>
  <p>Information is used only to provide authorized departmental workflows: account approval and role-based access; care-team coordination; patient-record administration; report requests; scheduling and operating-list coordination; clinician-reviewed documentation drafts; notifications; security; troubleshooting; auditability; and compliance with applicable KSMC governance obligations. Neurify does not sell personal or clinical information and does not use it for advertising or behavioral marketing.</p>
  <h2>3. AI-assisted documentation drafts</h2>
  <p>Where an authorized clinician selects the medical-report draft feature, Google Gemini may process a minimized, structured set of documented clinical content to create a documentation draft. The request is designed to exclude direct patient identifiers such as the patient name, record number, ward and bed details, messages, and attachments. The feature is not intended to diagnose, triage, recommend treatment, or create undocumented facts. A clinician must review, edit where appropriate, and explicitly approve a draft before it can be exported or shared.</p>
  <h2>4. Service providers and disclosures</h2>
  <p>Neurify uses approved technical service providers to operate authorized features. These may include Supabase for central data and approved sessions, Firebase Cloud Messaging for workflow notifications, and Google Gemini for the limited documentation-draft workflow described above. Information is disclosed only as necessary to provide the service, protect the application, comply with applicable obligations, or respond to an authorized KSMC request. Service-provider use remains subject to KSMC’s applicable procurement, security, and data-governance controls.</p>
  <h2>5. Notifications and report sharing</h2>
  <p>Workflow notifications are intended for authorized users and should not contain patient names, record numbers, diagnoses, or report content. Medical-report sharing is initiated only by an authorized clinician after review, explicit approval, and PDF export. Neurify does not automatically select a recipient or send a report on the clinician’s behalf.</p>
  <h2>6. Security and access</h2>
  <p>Neurify uses authenticated access, role-based permissions, approved central sessions, and encrypted service communications. Access is restricted to approved users and may be logged for security and operational review. No security control eliminates all risk; users must protect their credentials, use approved devices and channels, and follow KSMC policies for patient information.</p>
  <h2>7. Retention</h2>
  <p>Information is retained only for the period needed to operate Neurify and meet KSMC’s applicable clinical, security, legal, and regulatory retention requirements. Some information may need to be retained even after an account-deletion request where KSMC has a documented obligation or legitimate operational need to do so.</p>
  <h2>8. Privacy and account requests</h2>
  <p>Authorized users may request access, correction, or deletion of their Neurify account by contacting <a href="mailto:${KSMC_CONTACT_EMAIL}">${KSMC_CONTACT_EMAIL}</a> from their approved account email. Do not include patient names, record numbers, clinical details, screenshots, or attachments in an email request. KSMC will verify the request and respond under its approved privacy and retention process.</p>
  <h2>9. Changes to this policy</h2>
  <p>KSMC may update this policy to reflect changes to Neurify, service providers, applicable requirements, or operational practice. The current version will be posted at this address with its updated date.</p>
  <h2>10. Contact</h2>
  <p>For Neurify privacy and account requests, contact King Saud Medical City through the public contact channel: <a href="mailto:${KSMC_CONTACT_EMAIL}">${KSMC_CONTACT_EMAIL}</a>. Use the subject line <strong>“Neurify privacy request”</strong> and provide only your approved work contact details.</p>
`);

const arabicPrivacyPage = documentShell("سياسة الخصوصية", "ar", `
  <header><div class="brand">NEURIFY</div><h1>سياسة الخصوصية</h1><p class="meta">آخر تحديث: 1 سبتمبر 2026</p><div class="nav"><a href="mailto:${KSMC_CONTACT_EMAIL}?subject=%D8%B7%D9%84%D8%A8%20%D8%AE%D8%B5%D9%88%D8%B5%D9%8A%D8%A9%20Neurify">التواصل بشأن الخصوصية</a></div></header>
  <p>Neurify تطبيق مقيد الوصول لتنسيق أعمال مستخدمي قسم جراحة المخ والأعصاب المعتمدين في مدينة الملك سعود الطبية. تشرح هذه السياسة كيفية التعامل مع معلومات الحسابات والتشغيل ومسارات الملفات السريرية عند استخدام التطبيق من قبل المستخدمين المعتمدين.</p>
  <div class="notice"><strong>تنبيه مهم:</strong> يدعم Neurify التنسيق السريري والتوثيق، ولا يقدم نصيحة طبية مباشرة للمريض أو تشخيصًا أو فرزًا أو خدمة طوارئ. يظل الطبيب المخول مسؤولًا عن مراجعة أي توثيق سريري قبل استخدامه أو تصديره أو مشاركته.</div>
  <h2>1. المعلومات التي يتعامل معها التطبيق</h2>
  <p>قد يتعامل التطبيق مع معلومات الحساب والبيانات المهنية، مثل الاسم والبريد الإلكتروني المعتمد ورقم الهاتف والمسمى الوظيفي والدور والفريق وحالة اعتماد الحساب ورمز إشعارات الجهاز. وقد يتعامل كذلك مع بيانات سير عمل ملف المريض التي يدخلها المستخدمون المخولون، مثل بيانات التعريف والسجل والمعلومات السريرية الموثقة والفريق المعالج وطلبات التقارير والجداول والملاحظات التشغيلية والرسائل والمرفقات.</p>
  <h2>2. أغراض الاستخدام</h2>
  <p>تستخدم المعلومات فقط لتقديم أعمال القسم المعتمدة: اعتماد الحسابات والصلاحيات، وتنسيق الفريق المعالج، وإدارة ملفات المرضى، وطلبات التقارير، والجداول والعمليات، ومسودات التوثيق التي يراجعها الطبيب، والإشعارات، والأمن، واستكشاف الأعطال، والتدقيق، والالتزامات التنظيمية المعتمدة. لا يبيع Neurify المعلومات الشخصية أو السريرية ولا يستخدمها للإعلانات أو التسويق السلوكي.</p>
  <h2>3. مسودات التوثيق بمساعدة الذكاء الاصطناعي</h2>
  <p>عند اختيار طبيب مخول لميزة مسودة التقرير الطبي، قد تعالج Google Gemini مجموعة منظمة ومصغرة من المعلومات السريرية الموثقة لإنشاء مسودة توثيق. صُمم الطلب لاستبعاد الاسم ورقم الملف والجناح والسرير والرسائل والمرفقات. لا تُستخدم الميزة للتشخيص أو الفرز أو التوصية العلاجية أو إنشاء حقائق غير موثقة. ويجب أن يراجع الطبيب المسودة ويعدلها عند الحاجة ويعتمدها صراحة قبل التصدير أو المشاركة.</p>
  <h2>4. مزودو الخدمات والإفصاح</h2>
  <p>يستخدم Neurify مزودي خدمات تقنيين معتمدين لتشغيل الميزات المصرح بها، وقد يشمل ذلك Supabase للبيانات المركزية والجلسات المعتمدة، وFirebase Cloud Messaging لإشعارات سير العمل، وGoogle Gemini لمسار مسودة التوثيق المحدود. لا يُفصح عن المعلومات إلا بالقدر اللازم لتقديم الخدمة أو حماية التطبيق أو الوفاء بالالتزامات الواجبة أو الاستجابة لطلب مصرح به من KSMC.</p>
  <h2>5. الإشعارات ومشاركة التقارير</h2>
  <p>الإشعارات موجهة للمستخدمين المخولين، ويجب ألا تتضمن اسم المريض أو رقم الملف أو التشخيص أو محتوى التقرير. لا تتم مشاركة التقرير الطبي إلا بمبادرة الطبيب المخول بعد المراجعة والاعتماد الصريح وتصدير PDF. ولا يحدد التطبيق مستلمًا مسبقًا ولا يرسل التقرير تلقائيًا.</p>
  <h2>6. الحماية والوصول</h2>
  <p>يستخدم Neurify وصولًا موثقًا وصلاحيات حسب الدور وجلسات مركزية معتمدة واتصالات خدمة مشفرة. يقتصر الوصول على المستخدمين المعتمدين وقد يُسجل لأغراض الأمن والمراجعة التشغيلية. يجب على المستخدم حماية بيانات الدخول واستخدام الأجهزة والقنوات المعتمدة واتباع سياسات KSMC لبيانات المرضى.</p>
  <h2>7. الاحتفاظ بالبيانات</h2>
  <p>تُحتفظ المعلومات للمدة اللازمة لتشغيل Neurify والوفاء بمتطلبات KSMC السريرية والأمنية والقانونية والتنظيمية المعتمدة. قد يلزم الاحتفاظ ببعض البيانات بعد طلب حذف الحساب عند وجود التزام موثق أو حاجة تشغيلية مشروعة.</p>
  <h2>8. طلبات الخصوصية والحساب</h2>
  <p>يمكن للمستخدم المعتمد طلب الوصول إلى حسابه أو تصحيحه أو حذفه بالتواصل من بريده المعتمد إلى <a href="mailto:${KSMC_CONTACT_EMAIL}">${KSMC_CONTACT_EMAIL}</a>. لا تضع أسماء مرضى أو أرقام ملفات أو تفاصيل سريرية أو لقطات شاشة أو مرفقات في رسالة الطلب. تتحقق KSMC من الطلب وتتعامل معه وفق عملية الخصوصية والاحتفاظ المعتمدة.</p>
  <h2>9. تغييرات السياسة</h2>
  <p>قد تُحدّث KSMC هذه السياسة عند تغير Neurify أو مزودي الخدمة أو المتطلبات أو الممارسة التشغيلية. ستُنشر النسخة السارية في هذا الرابط مع تاريخ تحديثها.</p>
  <h2>10. التواصل</h2>
  <p>لطلبات الخصوصية والحسابات المتعلقة بـ Neurify، تواصل مع مدينة الملك سعود الطبية عبر قناة التواصل العامة: <a href="mailto:${KSMC_CONTACT_EMAIL}">${KSMC_CONTACT_EMAIL}</a>. استخدم العنوان <strong>«طلب خصوصية Neurify»</strong> وأرسل بيانات التواصل المهنية المعتمدة فقط.</p>
`);

export function registerPublicLegalPages(app: Express) {
  app.get("/privacy", (req, res) => {
    const requestedLanguage = typeof req.query.lang === "string" ? req.query.lang.toLowerCase() : "";
    res.type("html").send(requestedLanguage === "ar" ? arabicPrivacyPage : englishPrivacyPage);
  });
}
