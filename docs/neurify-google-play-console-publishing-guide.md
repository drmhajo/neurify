# دليل نشر Neurify في Google Play Console

**الإصدار المرجعي:** Neurify 1.0.50 — Android `versionCode` 51  
**معرّف الحزمة الثابت:** `com.app.ksmcneurosurgery`  
**الجمهور المقصود:** إدارة KSMC، فريق تقنية المعلومات، ومسؤول حساب Google Play  
**آخر مراجعة:** 1 سبتمبر 2026

> **تنبيه امتثال مهم:** أنا لست محاميًا. هذا الدليل مسودة تشغيلية مستندة إلى خصائص Neurify الحالية وإرشادات Google Play العامة، وليس استشارة قانونية أو تنظيمية. يجب أن يراجع مسؤول حماية البيانات والشؤون القانونية في KSMC كل بيان للخصوصية وأمان البيانات قبل إرساله؛ فالجهة الناشرة وحدها مسؤولة عن دقته.

## 1. القرار الموصى به قبل البدء

Neurify تطبيق داخلي مقيّد لموظفي الرعاية الصحية المعتمدين، ويعالج سجلات مرضى ومراسلات مهنية ويستخدم Google Gemini لإعداد **مسودات توثيق** يراجعها الطبيب. لذلك لا أوصي بإطلاقه كمنتج مفتوح لجميع مستخدمي Google Play في البداية. ابدأ باختبار داخلي، ثم اختبار مغلق لمجموعة موظفي KSMC محددة، وفعّل التوزيع الخاص عبر Managed Google Play إذا كانت المؤسسة تستخدمه. يتيح الاختبار الداخلي توزيع التطبيق على ما يصل إلى 100 مختبِر، بينما يظل الاختبار المغلق مقتصرًا على عناوين البريد أو مجموعات Google المحددة. [1]

| القرار | التوصية لـ Neurify | السبب |
|---|---|---|
| نوع حساب المطوّر | **حساب مؤسسة KSMC**، وليس حسابًا شخصيًا لطبيب أو مطوّر | يطابق ملكية البيانات والهوية المؤسسية والدعم الرسمي. |
| طريقة الإطلاق الأولى | **Internal testing** لفريق تقنية المعلومات والطاقم التجريبي | أقل تعرضًا، أسرع للاختبار، ويمنع الظهور العام. |
| المرحلة التالية | **Closed testing** لمجموعة KSMC محددة أو مجموعة Google مؤسسية | يتيح التحقق من الحسابات والإشعارات والتقارير مع نطاق محكوم. |
| الإنتاج العام | **لا تبدأ به** إلا بعد اعتماد الخصوصية، الحذف، بيانات الدخول للمراجع، وموافقة KSMC | التطبيق يعالج بيانات صحية وحسابات مهنية حساسة. |
| التوزيع الخاص | Managed Google Play عند توفره | يجعل التطبيق خاصًا بالمؤسسة وغير قابل للبحث العام. [1] |
| البلدان/المناطق | **Saudi Arabia** فقط في المرحلة الأولى، إن كانت خدمات KSMC موجهة للمملكة فقط | يقلل النطاق ويطابق الغرض التشغيلي المعلن. |
| السعر | **Free** | لا توجد عمليات بيع أو اشتراكات أو مشتريات داخل التطبيق. |

## 2. ما الذي يجب تجهيزه قبل فتح Play Console

Google Play يعتمد حزمة **Android App Bundle (`.aab`)** للتطبيقات الجديدة ويولّد ملفات APK المحسّنة للأجهزة من الحزمة. معرّف الحزمة فريد ودائم، لذا يجب الحفاظ على `com.app.ksmcneurosurgery` كما هو وعدم إنشاء إدخال Play آخر له. [2]

| المطلوب | الحالة في Neurify | الإجراء المطلوب قبل الرفع |
|---|---|---|
| ملف `.aab` موقع للإصدار | غير مرفق بهذا الدليل | أنشئ حزمة AAB من مسار البناء المعتمد، ثم افحص أن `versionCode` أعلى من أي حزمة سبق رفعها. |
| اسم التطبيق | جاهز: **Neurify** | استخدم الاسم نفسه في المتجر والحزمة وسياسة الخصوصية. |
| معرّف الحزمة | جاهز: `com.app.ksmcneurosurgery` | لا تغيّره بعد إنشاء التطبيق في Play Console. |
| سياسة خصوصية عامة | **حاجز نشر حالي** | أنشئ صفحة HTTPS عامة، غير PDF، متاحة دون تسجيل دخول وغير محجوبة جغرافيًا. [3] |
| حذف الحساب | **حاجز نشر حالي** | أضف مسار حذف داخل التطبيق وصفحة ويب عامة لطلب حذف الحساب والبيانات المرتبطة به. [4] |
| حساب مراجعة | **مطلوب** | أنشئ حساب اختبار ثابتًا بالإنجليزية مع بيانات تدريبية وهمية فقط، وليس حساب مشرف حقيقيًا. [5] |
| أصول المتجر | الشعار متاح؛ لقطات المتجر تحتاج تجهيزًا | جهّز شعارًا، Feature graphic، ولقطات شاشة لا تحتوي على مرضى حقيقيين أو أرقام ملفات حقيقية. [6] |
| موافقة الموردين | **مطلوبة** | وثّق اعتماد KSMC لـ Supabase وFirebase/FCM وGoogle Gemini وحدود معالجة البيانات. |

## 3. إنشاء التطبيق في Play Console

افتح [Google Play Console](https://play.google.com/console)، واختر **Home → Create app**. تطلب Google اللغة الافتراضية واسم التطبيق ونوعه وتسعيره وبريد دعم وإقرارات السياسات وقوانين التصدير وشروط Play App Signing. [2]

| حقل شاشة إنشاء التطبيق | الاختيار المقترح | ما يُكتب أو يُختار |
|---|---|---|
| Default language | **English (United States)** | الإنجليزية هي لغة Neurify الافتراضية، ثم أضف العربية كلغة متجر مترجمة. |
| App name | **Neurify** | لا تضف اسم المستشفى إلى الاسم إلا بعد تأكيد حق استخدامه في المتجر. |
| App or game | **App** | التطبيق ليس لعبة. |
| Free or paid | **Free** | لا توجد مدفوعات أو مشتريات داخل التطبيق. |
| Support email | بريد KSMC رسمي مراقَب | استخدم بريد فريق الدعم أو تقنية المعلومات، وليس بريدًا شخصيًا. |
| Policy / export declarations | اقبل فقط بعد مراجعة ممثل المؤسسة | لا تعالجها كخطوة شكلية؛ يجب أن يوافق مسؤول الحساب المؤسسي. |
| Play App Signing | **Accept** | يوصى باستخدامه لإدارة مفاتيح التوقيع وتوزيع الحزم عبر Play. |

## 4. Main store listing — نصوص مقترحة

أنشئ متجرًا إنجليزيًا أولًا، ثم أضف ترجمة عربية. لا تستخدم لقطات من بيئة الإنتاج، ولا تذكر أن التطبيق يقدم تشخيصًا أو علاجًا أو قرارًا طبيًا مستقلًا.

### 4.1 النصوص الإنجليزية المقترحة

| الحقل | النص المقترح |
|---|---|
| App name | `Neurify` |
| Short description | `Secure coordination for authorized neurosurgery teams.` |
| Full description | `Neurify is a restricted-access clinical coordination workspace for authorized neurosurgery teams. It supports care-team communication, patient-record workflows, report requests, on-call schedules, operating-room coordination, OPD waiting lists, and clinician-reviewed documentation drafts.\n\nAccess is limited to approved department users. Neurify is designed to support operational coordination and documentation workflows; it does not provide patient-facing medical advice, diagnosis, triage, treatment recommendations, or emergency services.\n\nMedical-report drafts are generated from documented, minimized clinical information and must be reviewed, edited where necessary, and explicitly approved by an authorized clinician before export or sharing. The application does not automatically send reports.\n\nNotifications are limited to authorized workflow events and should not be relied on for emergency communication. For urgent clinical matters, follow KSMC’s approved emergency and escalation procedures.` |
| App category | `Medical` |
| Contact email | `[KSMC official support email]` |
| Website | `[KSMC-approved product/support URL]` |
| Privacy policy | `[public HTTPS privacy-policy URL]` |

### 4.2 النصوص العربية المقترحة

| الحقل | النص المقترح |
|---|---|
| اسم التطبيق | `Neurify` |
| الوصف المختصر | `تنسيق آمن لفرق جراحة المخ والأعصاب المعتمدة.` |
| الوصف الكامل | `Neurify مساحة عمل مقيدة الوصول لتنسيق أعمال فرق جراحة المخ والأعصاب المعتمدة. يدعم التطبيق التواصل المهني للفريق، ومسارات ملفات المرضى، وطلبات التقارير، وجداول المناوبات، وتنسيق العمليات، وقوائم انتظار عمليات العيادات، ومسودات التوثيق التي يراجعها الطبيب.\n\nيقتصر الاستخدام على مستخدمي القسم المعتمدين. صُمم Neurify لدعم التنسيق التشغيلي والتوثيق، ولا يقدم نصيحة طبية مباشرة للمريض أو تشخيصًا أو فرزًا أو توصية علاجية أو خدمة طوارئ.\n\nتُنشأ مسودات التقارير الطبية من بيانات سريرية موثقة ومصغرة، ويجب أن يراجعها الطبيب المخول ويعدّلها عند الحاجة ويعتمدها صراحة قبل التصدير أو المشاركة. ولا يرسل التطبيق التقارير تلقائيًا.\n\nتقتصر الإشعارات على أحداث سير العمل للمستخدمين المعتمدين، ولا يجوز الاعتماد عليها في الحالات الطارئة. للحالات العاجلة يجب اتباع إجراءات الطوارئ والتصعيد المعتمدة في KSMC.` |

### 4.3 الأصول المرئية

اذهب إلى **Grow users → Store presence → Main store listing → Graphics**. تتغير متطلبات الأبعاد الدقيقة بحسب سطح العرض، لذلك اعتمد متطلبات Play Console التي تظهر أثناء الرفع. توصي Google بأن تعكس الأصول الوظائف الحقيقية وتلتزم بالسياسات؛ كما يمكن تعطيل **External marketing** لتقييد الترويج عبر خدمات Google، وهو مناسب للتطبيق الداخلي. [6]

| الأصل | توصية عملية |
|---|---|
| App icon | استخدم أيقونة Neurify المعتمدة فقط، من دون شعارات جهات لم تمنح موافقة استخدام علنية. |
| Feature graphic | تصميم يوضح علامة Neurify وتنسيق فرق جراحة الأعصاب، بلا أسماء مرضى أو شاشات سجل طبي حقيقية. |
| لقطات الهاتف | 5–8 لقطات تدريبية منزوعة الهوية: تسجيل الدخول، لوحة اليوم، الجداول، طلب التقرير، قائمة العمليات، لوحة المشرف. |
| وصف اللقطات | استخدم بيانات وهمية بوضوح مثل `TRAINING / DEMONSTRATION ONLY` إن ظهرت بيانات حالة. |
| فيديو المعاينة | اختياري. لا تستخدم تسجيلًا يحتوي على معلومات مرضى أو بيانات دخول أو مفاتيح. |

## 5. Policy → App content — ماذا تختار وماذا تكتب

توجد معظم الإقرارات في **Policy and programs → App content**. يجب أن تتطابق إجاباتك مع التطبيق الفعلي وسياسة الخصوصية وممارسات الموردين. Google تراجع المعلومات لكنها لا تحدد بدلاً من الجهة الناشرة مدى دقة الإفصاح. [7]

### 5.1 Privacy policy

أدخل رابط سياسة الخصوصية العامة بعد اعتمادها. يجب أن تذكر السياسة اسم **Neurify** والجهة المسؤولة ووسيلة اتصال للخصوصية وأنواع البيانات والغرض والموردين والحماية وفترات الاحتفاظ والحذف. يجب أن تكون صفحة HTTPS عامة وليست ملف PDF. [3]

**نص افتتاحي مقترح للسياسة — بعد مراجعة KSMC القانونية:**

> Neurify is an access-restricted clinical coordination application operated for authorized users of the King Saud Medical City Neurosurgery Department. The application processes professional account data and clinical workflow data solely to provide department-authorized coordination, documentation, scheduling, reporting, and notification functions. Clinical data is not sold or used for advertising. Access is role-based and data is transmitted over encrypted connections.

أضف نصًا عربيًا مطابقًا، وحدد بدقة: الموردين، موقع المعالجة، عقود المعالجة، الاحتفاظ، آلية طلب حذف الحساب، والاستثناءات التنظيمية المعتمدة إن وُجدت.

### 5.2 Ads

اختر **No** فقط إذا لم يضف التطبيق أو أي SDK إعلانات أو وحدات إعلانية. لا توجد في التكوين الحالي مكتبة إعلانات معلنة. [3]

### 5.3 App access / Sign-in details

اختر أن كل أو بعض وظائف التطبيق مقيّدة بتسجيل الدخول، ثم أضف بيانات مراجعة قابلة لإعادة الاستخدام وصالحة من أي دولة وباللغة الإنجليزية. لا تستخدم الحساب الإداري الفعلي ولا بيانات مرضى أو حسابات موظفين حقيقية؛ تطلب Google أن تظل بيانات الوصول صالحة طوال المراجعة. [5]

**نص مقترح لحقل Instructions (بالإنجليزية):**

> This is a restricted clinical workflow application for authorized staff. For Google Play review, use the dedicated reviewer account below. The account contains synthetic training data only and is isolated from operational users and patient data.\n\n> 1. Open the app and select English.\n> 2. Sign in with the reviewer username and password provided in the credential fields.\n> 3. Use Home, Reports, Schedule, Teams, and Notifications to review the main workflows.\n> 4. The Medical report feature creates a documentation draft from synthetic training data and requires explicit clinician approval before export. It does not diagnose, treat, or provide patient advice.\n> 5. Do not use external Google sign-in or create a new account during review.

| حقل بيانات الوصول | ما يوضع |
|---|---|
| Username | حساب مراجعة مخصص، مثل `[play-reviewer@your-domain]` أو اسم مستخدم اختباري ثابت |
| Password | كلمة مرور قوية لا تنتهي صلاحيتها أثناء المراجعة، محفوظة في Play Console فقط |
| OTP / MFA | لا تطلب رمزًا متغيرًا من المراجع؛ وفّر مسار مراجعة ثابتًا معتمدًا بدلًا من ذلك |
| Any other instructions | وضح أن الحساب تجريبي، وأن البيانات وهمية، ولا يحتاج اتصالًا بشبكة KSMC الداخلية |

### 5.4 Target audience and content

اختر **18 and over only** واذكر أن المنتج مخصص لموظفي الرعاية الصحية البالغين والمعتمدين وليس للأطفال. لا تحدد فئات الأطفال؛ دخولها يضيف التزامات Families غير مناسبة للتطبيق. يجب أن تُبنى الإجابة على الجمهور الفعلي، لا على درجة التصنيف المتوقعة. [8]

### 5.5 Content rating

ابدأ استبيان IARC، وأدخل بريد KSMC الرسمي للمراسلات. أجب بدقة عن المحتوى الموجود فعلًا. لا تخمّن الإجابات لإنتاج تصنيف منخفض؛ قد يؤدي تضليل الاستبيان إلى رفض التطبيق أو إزالته. [8]

| موضوع الاستبيان | إجابة/إرشاد مقترح لـ Neurify |
|---|---|
| نوع التطبيق | اختر الفئة الأقرب إلى **Utilities / Productivity / Communication / Other** إذا ظهرت في الاستبيان. |
| عنف أو محتوى جنسي أو قمار أو كحول أو لغة بذيئة | **No** للمحتوى الثابت الذي يقدمه التطبيق نفسه، ما لم تضف المؤسسة محتوى من هذا النوع. |
| محتوى ينشئه المستخدم | **Yes** إذا كان السؤال يشمل المراسلات والملاحظات والمرفقات التي يضيفها المستخدمون؛ وهذا ينطبق على الدردشة والملفات المهنية في Neurify. |
| صور طبية حساسة | راجعوا السؤال حرفيًا: اختر الإجابة المطابقة لما يمكن للمستخدمين رفعه فعليًا، خصوصًا إن كان قد يتضمن صورًا جراحية أو ملفات سريرية. لا تفترض `No`. |

> **حاجز إطلاق عام:** قبل طرح التطبيق خارج مجموعة مهنية مغلقة، يجب على KSMC مراجعة ضوابط المحتوى الذي ينشئه المستخدم، بما في ذلك آلية الإبلاغ والتعامل مع الإساءة أو المحتوى غير المقبول، وقيود الوصول والتدقيق. لا تصف آلية غير موجودة في التطبيق.

### 5.6 Health apps declaration

اذهب إلى **Policy → App content → Health Apps → Start**. يلزم الإقرار للتطبيقات الموجودة في الاختبار المغلق أو المفتوح أو الإنتاج. [9]

| سؤال/اختيار | التوصية المقترحة | شرط الاعتماد |
|---|---|---|
| هل يقدم التطبيق ميزات صحية؟ | **Yes** | التطبيق يتعامل مع تنسيق سريري وسجلات ومراسلات وتقارير. |
| الفئة | **Medical** | أكّد أن وصفك لا يدّعي وظيفة تشخيصية أو علاجية مستقلة. |
| وصف الميزة | استخدم النص أدناه | راجعه مسؤول KSMC السريري والقانوني. |
| Medical device | **No فقط** إذا أكّد القسم القانوني أن Neurify ليس جهازًا طبيًا منظمًا | إن كان منظمًا، لا تختر No؛ ستحتاج إثبات الموافقة/الترخيص عند الطلب. [10] |
| Government-affiliated / recognized healthcare organization | اختر **Yes فقط** مع موافقة موثقة على استخدام اسم وشعار KSMC والاستعداد لتقديم إثبات أهلية | لا تدّع الانتماء أو الاعتماد دون تفويض رسمي. [10] |

**نص مقترح لوصف Health Apps (بالإنجليزية):**

> Neurify is a restricted-access medical workflow application for authorized neurosurgery department staff. It supports role-based care-team coordination, patient-record administration, scheduling, report requests, notifications, and clinician-reviewed documentation drafts. It is not patient-facing and does not diagnose, triage, treat, cure, or prevent medical conditions. Any generated documentation draft requires clinician review and explicit approval before export or sharing.

### 5.7 AI-generated content

Neurify يستخدم Gemini لإنشاء مسودات توثيق مقيدة من معلومات موثقة ومصغرة، ويطلب مراجعة الطبيب واعتماده قبل التصدير. تُعد تطبيقات الإنتاجية ذات الذكاء الاصطناعي الذي يحسن ميزة موجودة من الأمثلة محدودة النطاق في توضيح سياسة المحتوى المولّد بالذكاء الاصطناعي، لكن تظل الجهة الناشرة مسؤولة عن حماية المستخدم ومنع المحتوى الضار أو المضلل. [11]

**ما يُكتب في مراجعة التطبيق/السياسة:**

> The AI feature is limited to generating a structured documentation draft from documented, minimized clinical information. It is not a diagnostic, treatment, triage, or patient-facing advice feature. The draft is editable and cannot be exported until an authorized clinician explicitly reviews and approves it. Patient identifiers, ward/bed details, messages, and attachments are excluded from the AI request.

### 5.8 COVID-19, News, Financial features, and other declarations

اختر **No** حيثما يكون ذلك صحيحًا:

| الإقرار | الاختيار المقترح |
|---|---|
| COVID-19 contact tracing / status | **No** |
| News and magazine | **No** |
| Financial features | **No** |
| Gambling | **No** |
| Ads | **No** |
| Data collection via Health Connect | **No**، ما دام التطبيق لا يدمج Health Connect |

## 6. Data safety — خريطة إفصاح مقترحة

كل تطبيق منشور في الاختبار المغلق أو المفتوح أو الإنتاج يحتاج نموذج Data safety دقيقًا؛ ويشمل الإفصاح عن ممارسات SDKs والموردين الخارجيين. الاختبار الداخلي فقط معفى من ظهور النموذج، لكن الاحتفاظ بإجابة مكتملة من البداية أفضل للتحضير للمرحلة التالية. [7]

> **لا تنسخ هذه الخريطة دون توقيع DPO/KSMC.** نموذج Google يسأل إن كانت البيانات “collected” أو “shared” وفق تعريفاته. معالجة المورد بوصفه مقدم خدمة قد تتطلب تفسيرًا تعاقديًا مختلفًا عن مشاركة البيانات مع طرف مستقل. يجب على مسؤول الخصوصية اعتماد كل اختيار، خصوصًا بيانات الصحة المرسلة إلى Gemini بصورة مصغرة.

| نوع البيانات في Data safety | هل يجمعه Neurify؟ | الغرض المقترح | يُرسل/يعالج لدى | ما يجب تأكيده قبل الإرسال |
|---|---:|---|---|---|
| الاسم | نعم | وظائف التطبيق، إدارة الحساب، التنسيق السريري | خدمة البيانات المركزية | هل الاسم هو اسم موظف، مريض، أو كليهما؛ وكيفية تصنيف كل حالة. |
| البريد الإلكتروني ورقم الهاتف | نعم للمستخدمين المسجلين | إدارة الحساب، التواصل، الأمان | خدمة البيانات المركزية | حدّد الحقول الاختيارية والاحتفاظ. |
| User IDs / أدوار وظيفية | نعم | الدخول الآمن والصلاحيات والتدقيق | خدمة البيانات المركزية | أكد أنها ليست لأغراض إعلانية أو تتبع. |
| Health information | نعم | السجل السريري، تنسيق الرعاية، التقارير | خدمة البيانات المركزية؛ Gemini لمسودة موثقة ومصغرة | Gemini لا يتلقى الاسم أو رقم الملف أو المحادثات أو المرفقات، لكن المحتوى السريري قد يظل بيانات صحية حساسة. |
| Photos / videos / files | نعم عند رفعها | مرفقات سريرية أو تشغيلية وتقارير | وفق مزود التخزين المعتمد | حدّد موضع التخزين، التشفير، الاحتفاظ، والوصول. |
| In-app messages | نعم | تنسيق الفريق | خدمة البيانات المركزية | لا ترسل محتوى المحادثة إلى Gemini. |
| Device or other IDs / Push token | نعم | تسليم إشعارات سير العمل | Firebase/FCM وخدمة الإشعار المركزية | لا تربط معرفات جهاز ثابتة مع بيانات حساسة خلافًا للسياسة. |
| التشخيصات أو التوصيات الطبية | لا يُنشئها الذكاء الاصطناعي | غير منطبق | غير منطبق | لا تدّع أن الذكاء الاصطناعي يقدم تشخيصًا أو علاجًا. |
| الموقع الدقيق، جهات الاتصال، المدفوعات | لا | غير منطبق | غير منطبق | أبقها غير محددة إن لم يجمعها أي SDK. |

### إجابات أمان البيانات المقترحة

| سؤال Data safety | الإجابة المقترحة | شرط الصحة |
|---|---|---|
| Does your app collect or share user data? | **Yes** | لأن التطبيق يتعامل مع حسابات وبيانات صحية وملفات ورسائل وإشعارات. |
| Is all user data encrypted in transit? | **Yes فقط** بعد تحقق تقني أن كل مسار إنتاج يستخدم HTTPS/TLS بلا استثناء | راجعه فريق البنية التحتية. |
| Do you provide a way for users to request data deletion? | **Yes فقط** بعد تنفيذ مسار داخل التطبيق ورابط ويب خارجي | لا تستخدم `No` كحل نهائي لتطبيق ينشئ حسابات. [4] |
| Is data used for advertising, marketing, or personalization? | **No** إذا ظل التطبيق بلا SDK إعلاني أو تحليلات تسويقية | راجع جميع SDKs قبل الإرسال. |
| Is data optional? | حدّد لكل نوع وفق واجهة التطبيق | بيانات الاعتماد والحساب عادة لازمة؛ لا تعمّم. |

## 7. حسابات المستخدمين والحذف والخصوصية

لأن Neurify يسمح بطلب حساب جديد، يحتاج مسار حذف حساب من داخل التطبيق **ومن صفحة ويب عامة** لطلب حذف الحساب والبيانات المرتبطة، مع بيان ما قد تحتفظ به KSMC لأسباب تنظيمية أو أمنية. تجميد الحساب لا يكفي بديلاً عن الحذف. [4]

**نص مقترح لصفحة حذف الحساب:**

> Authorized Neurify users may request deletion of their Neurify account by submitting this form or contacting `[KSMC privacy contact]` from their registered email address. KSMC will verify the request and delete or de-identify account data that is not required to be retained for security, clinical governance, legal, or regulatory obligations. Where retention is required, the requestor will be informed of the data category and retention basis.

لا تنشر نموذج حذف قبل أن يوافق عليه فريق الخصوصية ويُربط بإجراء فعلي ومحدّد المسؤولية.

## 8. الاختبار والرفع الأول

اختبر التطبيق داخليًا قبل الاختبار المغلق. بعد نشر اختبار داخلي أو مغلق للمرة الأولى قد يستغرق ظهور رابط الاختبار للمختبرين ساعات، ويجب مشاركة الرابط أو رابط الاشتراك مع المختبرين؛ لا يعتمدون على البحث في المتجر. [1]

### مسار الاختبار المقترح

1. **Internal testing:** أضف فريق التقنية و3–10 مستخدمين سريريين مخولين فقط، وارفع AAB بالإصدار الجديد.
2. أنشئ ملاحظات الإصدار التالية:

   **English:** `Initial restricted clinical coordination release for authorized Neurosurgery Department users. Includes role-based access, report requests, schedules, notifications, and clinician-reviewed documentation drafts.`

   **Arabic:** `الإصدار الأول المقيد لمستخدمي قسم جراحة المخ والأعصاب المعتمدين. يتضمن الصلاحيات حسب الدور وطلبات التقارير والجداول والإشعارات ومسودات توثيق يراجعها الطبيب.`

3. شارك رابط الاختبار مع المختبرين المؤسسيين فقط، واطلب منهم عدم استخدام مرضى حقيقيين في بيئة الاختبار.
4. افحص **Pre-launch report** وAndroid vitals، وسجّل الملاحظات دون تضمين بيانات سريرية في تذاكر الدعم.
5. انتقل إلى **Closed testing** بعد إصلاح الأعطال وتثبيت سياسة الخصوصية وحذف الحساب وبيانات المراجع.
6. استخدم الإنتاج فقط بعد توقيع DPO/KSMC وموافقة سياسة Google Play.

## 9. رفع الإصدار في Play Console — خطوات عملية

1. افتح التطبيق في Play Console ثم **Test and release → Testing → Internal testing**.
2. أضف المختبرين أو مجموعة Google المؤسسية، ثم اختر **Create new release**.
3. ارفع ملف AAB. تأكد أن `versionCode` أعلى من السابق وأن package name هو `com.app.ksmcneurosurgery`.
4. أدخل ملاحظات الإصدار الإنجليزية والعربية أعلاه، ثم احفظ المسودة واضغط **Next**.
5. عالج كل خطأ أحمر في شاشة **Preview and confirm**. لا تتجاهل أخطاء سياسة الخصوصية أو الوصول أو Data safety.
6. اختر **Start rollout to Internal testing**. راقب صفحة **Latest releases and bundles** للتأكد من وصول الحزمة للمسار المقصود. [12]
7. عند الجاهزية للاختبار المغلق، أنشئ مسارًا مغلقًا، أضف مجموعة المختبرين، وأكمل App content وData safety وHealth apps declaration وبيانات الوصول للمراجع.
8. قبل الإنتاج، استخدم **Publishing overview** لمراجعة كل تغيير مرسل للمراجعة، وفعّل Managed publishing إن أرادت KSMC التحكم في توقيت ظهور التغييرات.

## 10. قائمة الحواجز قبل الاختبار المغلق أو الإنتاج

| الحالة | بند الحاجز | المسؤول المقترح |
|---|---|---|
| [ ] | اعتماد حساب مطوّر مؤسسة KSMC وتحديد مالك الحساب وممثل الدعم | KSMC IT / الإدارة |
| [ ] | إنشاء رابط Privacy Policy عام وقابل للوصول | DPO + قانوني + IT |
| [ ] | تنفيذ رابط وواجهة طلب حذف الحساب واختبارهما | فريق المنتج + DPO |
| [ ] | توثيق تدفقات البيانات مع Supabase وFCM وGemini واعتمادها | DPO + أمن معلومات |
| [ ] | اعتماد تصنيف Health Apps وMedical Device وعدم ادعاء وظيفة تشخيصية | قيادة سريرية + قانوني |
| [ ] | توفير إثبات الانتماء لـ KSMC إن سيُستخدم الاسم أو الشعار كجهة رسمية | إدارة KSMC |
| [ ] | إنشاء حساب مراجعة ثابت ببيانات تدريبية فقط | مسؤول التطبيق |
| [ ] | إعداد لقطات متجر منزوعة الهوية ومراجعتها | فريق المنتج + DPO |
| [ ] | مراجعة UGC/الدردشة والمرفقات وإضافة ضوابط مطلوبة قبل إتاحة عامة | أمن معلومات + قانوني |
| [ ] | توقيع Data safety بعد مراجعة جميع SDKs والموردين | DPO |
| [ ] | رفع AAB باختبار داخلي ناجح ومراجعة Pre-launch report | فريق التقنية |

## 11. ملخص سريع: ماذا أكتب الآن؟

| الحقل | الإجابة المقترحة الآن |
|---|---|
| App name | `Neurify` |
| Default language | `English (United States)` |
| App type | `App` |
| Price | `Free` |
| Category | `Medical` |
| Ads | `No` |
| Target audience | `18 and over only` |
| Health apps | `Yes → Medical` |
| Medical device | `No` **فقط بعد تأكيد قانوني مكتوب** |
| Data collection | `Yes` |
| Data in transit encrypted | `Yes` **بعد تحقق تقني** |
| Privacy policy | لا ترسل النموذج حتى يتوفر رابط HTTPS عام معتمد |
| App access | حساب مراجع خاص ثابت ببيانات تدريبية فقط وتعليمات إنجليزية |
| First release track | `Internal testing` |
| Countries | `Saudi Arabia` كبداية، إذا كانت سياسة KSMC تؤكد ذلك |

## References

[1] [Google Play Console — Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)  
[2] [Google Play Console — Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)  
[3] [Google Play Console — Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)  
[4] [Google Play Console — App account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)  
[5] [Google Play Console — Requirements for providing sign-in details for review](https://support.google.com/googleplay/android-developer/answer/15748846?hl=en)  
[6] [Google Play Console — Add preview assets to showcase your app](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)  
[7] [Google Play Console — Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)  
[8] [Google Play Console — Content rating requirements](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en)  
[9] [Google Play Console — Health apps declaration](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en)  
[10] [Google Play Console — Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)  
[11] [Google Play Console — AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294?hl=en)  
[12] [Google Play Console — Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en)
