# HAKIM Ω — Enterprise Education Architecture

## الهدف
تحويل HAKIM Ω من مساحة عمل فردية إلى منظومة تعليم مؤسسية قابلة للتوسع للمدارس والمعلمين والطلبة، مع هوية Microsoft 365 المؤسسية، تكامل Microsoft Graph Education، طبقة ذكاء متعددة المزودين، وطبقة حوكمة وأتمتة قابلة للتدقيق.

## 1. الهوية والوصول
- Microsoft Entra ID هو موفر الهوية الأساسي لحسابات العمل والمدرسة.
- تطبيق SPA يستخدم MSAL Browser وAuthorization Code Flow + PKCE.
- الوضع الافتراضي `organizations` لقبول حسابات Microsoft 365 للعمل/المدرسة.
- عند اعتماد المؤسسة رسميًا، تُقيد الوصول إلى Tenant ID/IDs الخاصة بالمؤسسة عبر allowlist.
- الأدوار المستقبلية: Ministry Admin → Directorate Admin → School Admin → Teacher → Student → Observer.
- مبدأ أقل صلاحية: لا تُطلب Microsoft Graph permissions إلا عند الحاجة الفعلية.

## 2. Microsoft Graph Education
طبقة Graph يجب أن تدعم:
- المدرسة.
- الصفوف والشعب.
- المعلمين والطلبة.
- التسجيلات والروستر.
- الواجبات والتسليمات.
- الربط مع Microsoft Teams عند اعتماد الصلاحيات المؤسسية.

تُستخدم واجهات `/education` في Microsoft Graph v1.0 للإنتاج، ولا تعتمد واجهات beta في المسارات الحرجة.

## 3. الذكاء الاصطناعي
طبقة AI متعددة المزودين:
1. Google Gemini.
2. مزود بديل قابل للضبط.
3. محرك محلي حتمي للمهام التعليمية الأساسية.

الذكاء لا يُستخدم كحقيقة نهائية؛ كل مخرج يمر عبر:
- schema validation
- policy validation
- pedagogical validation
- mathematical/visual validation عند الحاجة
- provenance/evidence metadata عند الحاجة

## 4. مفاتيح Google
### مؤسسيًا — الموصى به
ضع `GEMINI_API_KEY` في بيئة الخادم/Vercel Environment Variables. لا تضع المفتاح في GitHub ولا في HTML.

### للمستخدم المتقدم
الواجهة الحالية توفر إدخال مفتاح Gemini محليًا لدعم سيناريوهات BYOK. المفتاح يُخزن محليًا فقط ويُرسل عند طلب API عبر `x-gemini-key`.

هذا الوضع مناسب للتجربة الشخصية وليس الخيار الأفضل لتوزيع مفتاح مشترك على جميع المعلمين.

## 5. الأتمتة
المسار المستهدف:

Microsoft Login → تحديد المؤسسة والدور → مزامنة الهوية والروستر → مساحة المعلم → توليد المحتوى → تدقيق → نشر → Teams/Assignments → تعلم الطالب → تقويم → تحليلات → تقارير → أرشفة.

## 6. الاستمرارية
- AI provider failure → provider fallback.
- quota failure → alternate provider.
- network failure → local deterministic engine حيثما أمكن.
- browser refresh → session recovery.
- export → portable project backup.
- GitHub CI → regression gate.

## 7. الخصوصية وحماية الطفل
- عدم إرسال بيانات طالب إلى مزود AI دون ضرورة وصلاحية مؤسسية واضحة.
- تقليل البيانات (data minimization).
- فصل هوية المستخدم عن المحتوى قدر الإمكان.
- عدم وضع أسرار في العميل.
- سجلات تدقيق للعمليات الحساسة.
- صلاحيات RBAC/ABAC قبل عمليات إدارة الصفوف والطلبة.

## 8. فلسطين ووزارة التربية والتعليم
لا يجوز الادعاء أن المنظومة «معتمدة من الوزارة» قبل وجود اعتماد رسمي. التصميم يستهدف قابلية المواءمة مع المناهج الفلسطينية وسياسات الجهة المالكة، ويترك نقاط السياسة الرسمية قابلة للتهيئة بدل افتراضها.

## 9. البعد الإسلامي
المنظومة تدعم التربية الإسلامية الفعلية من خلال:
- الأمانة والصدق والتحقق.
- احترام الإنسان وكرامته.
- العدل وعدم التمييز.
- الإحسان وإتقان العمل.
- المسؤولية والاستخلاف.
- عدم اختلاق النصوص أو نسبتها إلى القرآن والسنة بلا تحقق.

القيمة الإسلامية هنا سلوك وحوكمة ومحتوى موثق، وليست مجرد زخرفة بصرية.

## 10. بوابة القبول
لا يُعلن الإنتاج النهائي إلا بعد تحقق:
- Microsoft login
- tenant restriction
- role mapping
- Graph roster read
- AI provider health
- Gemini key path
- fallback path
- audit logging
- backup/restore
- security headers
- E2E smoke tests
- regression suite
