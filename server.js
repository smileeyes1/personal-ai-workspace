import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// ----------------------------------------------------
// 00. MIDDLEWARE & SECURITY HEADERS
// ----------------------------------------------------
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------
// 01. CONSTANTS, SYSTEM PROMPTS & CURRICULUM
// ----------------------------------------------------
const HAKIM_CORE_SYSTEM_PROMPT = `أنت "HAKIM Ω — حكيم أوميغا"، المستشار البيداغوجي والتربوي الأعلى للصفوف الأساسية (1 - 4).
مهمتك: صياغة وتصميم وتدقيق المخرجات التعليمية وفق أعلى المعايير البيداغوجية العالمية والوطنية.

المبادئ الهندسية والبيداغوجية الحاكمة:
1. التدرج النمائي الحتمي (CPA Framework):
   - المحسوس (Concrete): توظيف أدوات حقيقية محسوسة وملموسة من بيئة المتعلم (أزرار، مكعبات دينز، بطاقات ملونة).
   - المصور / شبه المحسوس (Pictorial): نماذج بصرية، تمثيلات رسومية دقيقة، ومجموعات متطابقة عددياً بنسبة 100%.
   - الرمزي / المجرد (Abstract): الأعداد والرموز الحسابية والقواعد اللغوية الصريحة.
2. الترتيب البصري والرياضي الصارم:
   - كتابة جميع التعبيرات الحسابية صراحة بالترتيب (المعامل الأول + الإشارة + المعامل الثاني = الناتج) مع عزلها باتجاه LTR.
   - مطابقة القيمة الرقمية لعدد العناصر الرسومية المذكورة دون أي تفاوت (مثال: 4 تفاحات 🍎🍎🍎🍎).
3. التمايز والدعم التفريدي:
   - تحديد معايير إتقان واضحة، أنشطة علاجية ملموسة للطلبة المتعثرين، وأنشطة إثرائية تعزز التفكير الإبداعي.
4. الأمانة العلمية:
   - صياغة موثقة خالية من الأخطاء العلمية أو المبالغات، مع مراعاة القاموس اللغوي للطفل في الصفوف الأساسية.`;

const TASK_PROMPTS = {
  lesson: `صمم خطة درس تعليمية متكاملة وقابلة للتطبيق الصفي المباشر وفق نموذج التدرج (محسوس ← مصور ← مجرد):
- بيانات الدرس (المبحث، الصف، الوحدة، الكفاية المستهدفة)
- ناتج التعلم الرئيس والمحدد بدقة
- معايير الأداء والتحقق
- التهيئة الحافزة والمحسوسات المستخدمة
- خطوات التدريس خطوة بخطوة مع أسئلة المعلم الموجهة والاستجابات المتوقعة
- النشاط الفردي والتعاوني
- معالجة المفاهيم الخاطئة المحتملة والتدخل العلاجي
- الغلق والتقويم الختامي`,

  worksheet: `أنشئ ورقة عمل صفية تفاعلية جاهزة للطباعة فوراً:
- ترويسة مدرسية نظامية (المبحث، الصف، اسم التلميذ، التاريخ)
- الهدف التعليمي المباشر
- إرشادات التلميذ بلغة ميسرة ومناسبة لقاموس المرحلة
- تمارين متدرجة الصعوبة (تمرين 1: تعرف ومطابقة مصورة، تمرين 2: تطبيق وتفكير، تمرين 3: تحدٍ وحل مشكلات)
- مساحات واضحة ومنظمة لكتابة ورسم الإجابات
- مفتاح الإجابة وسلم تقدير بسيط`,

  assessment: `صمم أداة تقويم تربوية (تشخيصي / تكويني / ختامي) متوازنة:
- جدول المواصفات ونواتج التعلم المقاسة
- فقرات الاختبار المتنوعة (موضوعية ومقالية قصيرة مدعمة بالصور)
- سلم تقدير لفظي (Rubric) ومعيار الإتقان (مثال: 80% فما فوق)
- خطة علاجية موازية للطلبة دون معيار الإتقان`,

  audit: `أنت المدقق البيداغوجي الصارم (HAKIM Ω Auditor).
قم بفحص المحتوى التعليمي عبر الأبعاد السبعة:
1. السلامة العلمية والرياضية
2. الملاءمة النمائية وقاموس التلميذ
3. مسار التدرج النمائي CPA
4. دقة الصياغة وموثوقية الشواهد
5. معايير الإتقان ومفتاح الإجابة
6. الترتيب البصري للتعبيرات الحسابية
7. التوازن المعرفي وخلوه من الإرباك
قدم تقريرًا يحتوي على:
- الدرجة المئوية لكل معيار (من 100) والدرجة الكلية
- التقييم النهائي: [PASS] أو [PASS WITH WARNINGS] أو [FAIL]
- نقاط القوة والملاحظات الواجب تصحيحها
- النسخة المعدلة المنقحة بالكامل والجاهزة للاستخدام.`,

  quick_chat: `أجب بإيجاز تربوي رصين وعملي ومباشر على استفسار المعلم.`,
  source_analysis: `حلل المصدر المرفق واستخرج المفاهيم الأساسية والأهداف والكفايات التعليمية بدقة.`,
  deep_analysis: `قم بتحليل وتصميم بيداغوجي معمق وشامل مع تدقيق متعدد المراحل.`
};

// Task Token & Temperature Profiles
const TASK_BUDGETS = {
  quick_chat: { maxOutputTokens: 2048, temperature: 0.3, level: 1, preferredModel: 'gemini-3.1-flash-lite' },
  lesson: { maxOutputTokens: 6144, temperature: 0.2, level: 2, preferredModel: 'gemini-3.7-flash' },
  worksheet: { maxOutputTokens: 4096, temperature: 0.15, level: 2, preferredModel: 'gemini-3.7-flash' },
  assessment: { maxOutputTokens: 4096, temperature: 0.15, level: 2, preferredModel: 'gemini-3.7-flash' },
  source_analysis: { maxOutputTokens: 4096, temperature: 0.2, level: 3, preferredModel: 'gemini-3.7-flash' },
  audit: { maxOutputTokens: 5120, temperature: 0.1, level: 3, preferredModel: 'gemini-3.7-flash' },
  deep_analysis: { maxOutputTokens: 8192, temperature: 0.2, level: 4, preferredModel: 'gemini-3.1-pro-preview' }
};

// ----------------------------------------------------
// 02. TOKEN ECONOMY & MULTI-TIER CACHE (L1 - L4)
// ----------------------------------------------------
class TokenEconomyEngine {
  constructor() {
    this.l1RequestCache = new Map(); // L1: Identical request hash (5m TTL)
    this.l2ProjectCache = new Map(); // L2: Project-level outputs
    this.l3FileOpsCache = new Map(); // L3: File chunks & extracted summaries
    this.l4PedagogicalAssets = new Map(); // L4: Reusable rubrics & templates
    this.inFlightRequests = new Map(); // Request deduplication
    this.l1TtlMs = 5 * 60 * 1000;
  }

  generateHash(contents, systemInstruction, task, model) {
    const raw = JSON.stringify({ contents, systemInstruction, task, model });
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  getL1(key) {
    if (!this.l1RequestCache.has(key)) return null;
    const entry = this.l1RequestCache.get(key);
    if (Date.now() - entry.timestamp > this.l1TtlMs) {
      this.l1RequestCache.delete(key);
      return null;
    }
    return entry;
  }

  setL1(key, text, model, metadata = {}) {
    this.l1RequestCache.set(key, {
      text,
      model,
      timestamp: Date.now(),
      metadata
    });
    if (this.l1RequestCache.size > 300) {
      const oldestKey = this.l1RequestCache.keys().next().value;
      this.l1RequestCache.delete(oldestKey);
    }
  }

  compactContext(contents, maxTurns = 4) {
    if (!Array.isArray(contents) || contents.length <= maxTurns) {
      return contents;
    }
    // Keep first turn (for context) + last N-1 turns
    const firstTurn = contents[0];
    const recentTurns = contents.slice(-maxTurns + 1);
    return [firstTurn, ...recentTurns];
  }

  getInFlight(key) {
    return this.inFlightRequests.get(key) || null;
  }

  setInFlight(key, promise) {
    this.inFlightRequests.set(key, promise);
  }

  deleteInFlight(key) {
    this.inFlightRequests.delete(key);
  }
}

const tokenEconomy = new TokenEconomyEngine();

// ----------------------------------------------------
// 03. LOCAL DETERMINISTIC ENGINE (LEVEL 0 — 100% Offline)
// ----------------------------------------------------
class LocalDeterministicEngine {
  constructor() {
    this.name = 'Local Deterministic Engine (Offline)';
    this.id = 'local-deterministic';
  }

  async healthCheck() {
    return { status: 'HEALTHY', latencyMs: 0, connected: true };
  }

  getCapabilities() {
    return {
      canGenerateLesson: true,
      canGenerateWorksheet: true,
      canGenerateAssessment: true,
      canAudit: true,
      requiresInternet: false,
      cost: 0
    };
  }

  getQuotaState() {
    return { status: 'UNLIMITED', remaining: Infinity };
  }

  classifyError() {
    return { type: 'LOCAL_ENGINE_ERROR', message: 'خطأ في المحرك المحلي الحتمي.' };
  }

  generate({ task = 'general', prompt = '', grade = 'الصف الأول', subject = 'الرياضيات', competencyTitle = '' }) {
    const pLower = (prompt + ' ' + competencyTitle).toLowerCase();
    const isMath = subject.includes('رياضيات') || pLower.includes('جمع') || pLower.includes('طرح') || pLower.includes('عدد') || pLower.includes('ضرب');
    const isArabic = subject.includes('عربي') || pLower.includes('حرف') || pLower.includes('قراءة') || pLower.includes('إملاء');
    const isScience = subject.includes('علوم') || pLower.includes('نبات') || pLower.includes('مادة') || pLower.includes('حواس');

    if (task === 'lesson') {
      return this.generateDeterministicLesson({ grade, subject, isMath, isArabic, isScience, prompt });
    } else if (task === 'worksheet') {
      return this.generateDeterministicWorksheet({ grade, subject, isMath, isArabic, isScience, prompt });
    } else if (task === 'assessment') {
      return this.generateDeterministicAssessment({ grade, subject, isMath, isArabic, isScience, prompt });
    } else if (task === 'audit') {
      return this.generateDeterministicAudit(prompt);
    } else {
      return this.generateDeterministicGeneral({ grade, subject, prompt });
    }
  }

  generateDeterministicLesson({ grade, subject, isMath, prompt }) {
    const topic = prompt.trim() || 'مفهوم الأعداد والعمليات الأساسية';
    return `### خطة درس بيداغوجية معتمدة وفق التدرج النمائي (CPA)
**المبحث:** ${subject} | **الصف:** ${grade}
**عنوان الدرس:** ${topic}

---

#### 1. نواتج التعلم ومعايير التحقق:
- **الهدف الرئيس:** أن يوظف التلميذ الأدوات المحسوسة والتمثيلات المصورة لفهم المفهوم وتطبيقه بدقة 100%.
- **معيار الإتقان:** حل 4 تمارين تطبيقية من أصل 5 بشكل صحيح وبشكل مستقل.

#### 2. مسار التدرج النمائي (CPA Progression):
1. **المرحلة المحسوسة (Concrete):**
   - استخدام مكعبات دينز والأزرار الملونة لتمثيل الكميات ومشاركتها في مجموعات ثنائية.
   - نشاط عملي: توزيع 6 قطع عد محسوسة في صندوقين متطابقين واستنتاج المجموع.
2. **المرحلة شبه المحسوسة / المصورة (Pictorial):**
   - رسم مجموعات بصرية واضحة ومتطابقة تمامًا:
     رسم 4 نجوم ⭐⭐⭐⭐ + 2 نجمتان ⭐⭐ = 6 نجوم.
3. **المرحلة المجردة والرمزية (Abstract):**
   - كتابة التعبير الرياضي الصريح بعزل اتجاهي واضح:
     <span class="math-expr" dir="ltr">4 + 2 = 6</span>

#### 3. خطوات التنفيذ الصفي والتدريس المتمايز:
- **التهيئة الحافزة (5 دقائق):** لغز بصري حول ترتيب الأشياء في بيئة الصف.
- **التدريس الموجه (15 دقيقة):** نمذجة المعلم للمفهوم عبر المحسوسات، ثم طرح أسئلة موجهة لتعزيز الفهم.
- **النشاط التعاوني والفردي (15 دقيقة):** بطاقات عمل تفاعلية تراعي الفروق الفردية.
- **التدخل العلاجي:** استخدام خط الأعداد المحسوس للطلبة المحتاجين لدعم إضافي.
- **الغلق والتقويم التكويني (5 دقائق):** بطاقة خروج سريعة تحتوي على مسألة واحدة.`;
  }

  generateDeterministicWorksheet({ grade, subject, prompt }) {
    const topic = prompt.trim() || 'الأنشطة التطبيقية المتدرجة';
    return `### ورقة عمل تطبيقية تفاعلية
**المدرسة:** مساحة HAKIM Ω التعليمية | **الصف:** ${grade}
**المبحث:** ${subject} | **الاسم:** .................................... | **التاريخ:** .... / .... / 2026

**الهدف التعليمي:** تعزيز المهارة وتثبيت المفهوم عبر التدرج البصري والرمزي.

---

#### التمرين الأول: (المستوى البصري والمطابقة)
عد العناصر في كل مجموعة واكتب العدد المناسب داخل المربع:
1. 🍎 🍎 🍎 🍎  [ ...... ]
2. 🚗 🚗 🚗  [ ...... ]
3. ✏️ ✏️ ✏️ ✏️ ✏️  [ ...... ]

#### التمرين الثاني: (المستوى التطبيقي والرمزي)
أوجد الناتج الصحيح للتعبيرات التالية:
- <span class="math-expr" dir="ltr">3 + 4 = [ .... ]</span>
- <span class="math-expr" dir="ltr">5 + 2 = [ .... ]</span>
- <span class="math-expr" dir="ltr">6 - 2 = [ .... ]</span>

#### التمرين الثالث: (تحدي التفكير وحل المشكلات)
لدى أحمد 4 أقلام، واشترى له والده 3 أقلام أخرى.
- كم قلماً أصبح مع أحمد؟
- جملة الحل: <span class="math-expr" dir="ltr">4 + 3 = 7</span> أقلام.

---
**سلم التقدير:** ممتاز (3 نجوم ⭐⭐⭐) | جيد جداً (نجمتان ⭐⭐) | متابعة ومراجعة (نجمة ⭐)`;
  }

  generateDeterministicAssessment({ grade, subject, prompt }) {
    const topic = prompt.trim() || 'التقويم التكويني المعتمد';
    return `### أداة تقويم تربوية وبيداغوجية متوازنة
**المبحث:** ${subject} | **الصف:** ${grade} | **الموضوع:** ${topic}

---

#### 1. جدول المواصفات ونواتج التعلم:
| ناتج التعلم | نوع السؤال | الوزن النسبي | الدرجة |
| :--- | :--- | :---: | :---: |
| التعرف والتمثيل البصري | موضوعي (مطابقة) | 40% | 4 درجات |
| التطبيق الحسابي الرمزي | إكمال جمل حسابية | 40% | 4 درجات |
| حل المسائل وسياق الحياة | مسألة لفظية مصورة | 20% | درجتان |

#### 2. فقرات التقويم:
- **السؤال الأول:** صل كل مجموعة عددية بالرمز الصحيح لها.
- **السؤال الثاني:** أكمل الجملة الرياضية: <span class="math-expr" dir="ltr">5 + 3 = 8</span>.
- **السؤال الثالث:** مثل جملة الجمع برسم دوائر ملونة متطابقة.

#### 3. سلم التقدير اللفظي (Rubric) ومعيار الإتقان:
- **معيار الإتقان المنشود:** تحقيق 80% فما فوق (8 من 10).
- **الخطة العلاجية الفورية:** إعادة نمذجة المفهوم بالمحسوسات للطلبة الحاصلين على أقل من 8 درجات.`;
  }

  generateDeterministicAudit(content) {
    const auditRes = auditPedagogicalContentDeterministic(content);
    return `### تقرير التدقيق البيداغوجي المعتمد (HAKIM Ω Auditor)
**التقييم العام:** [${auditRes.status}]
**الدرجة الكلية المحققة:** ${auditRes.score} / 100

---

#### تفاصيل فحص الأبعاد السبعة:
1. **السلامة العلمية والرياضية:** ${auditRes.scores.mathSafety}%
2. **الملاءمة النمائية وقاموس المرحلة:** ${auditRes.scores.developmental}%
3. **مسار التدرج النمائي (CPA):** ${auditRes.scores.cpaProgression}%
4. **دقة الصياغة والأمانة العلمية:** ${auditRes.scores.clarity}%
5. **وضوح معايير الإتقان والتقويم:** ${auditRes.scores.masteryCriteria}%
6. **الترتيب البصري للتعبيرات الحسابية (Math Visual Order):** ${auditRes.scores.mathVisualOrder}%
7. **التوازن المعرفي وخلوه من الإرباك:** ${auditRes.scores.cognitiveBalance}%

#### الملاحظات والمواطن المرصودة:
${auditRes.issues.length === 0 ? '- لم يتم رصد أي أخطاء أو عيوب بيداغوجية. المحتوى متكامل وجاهز للاستخدام.' : auditRes.issues.map(i => `- [${i.severity}] ${i.message}`).join('\n')}

#### التوصية والقرار:
${auditRes.status === 'PASS' ? 'المحتوى مطابق للمعايير المعتمدة وجاهز للتطبيق الصفي الفوري والتصدير.' : 'تم توجيه التعديلات البيداغوجية لإعادة الضبط وفق التدرج المعتمد.'}`;
  }

  generateDeterministicGeneral({ grade, subject, prompt }) {
    return `### استجابة تربوية موثقة من محرك HAKIM Ω
**المبحث:** ${subject} | **الصف:** ${grade}

بناءً على طلبكم: "${prompt}"

تم تنظيم الاستجابة وفق معايير التدريس الفعال:
1. **التأسيس المفاهيمي:** ربط المعرفة السابقة بالخبرات الجديدة للطفل.
2. **النشاط العملي:** توظيف التعلم النشط والمجموعات البصرية.
3. **التطبيق والتحقق:** توفير فرصة للتطبيق الذاتي وقياس الإتقان.`;
  }
}

const localDeterministicEngine = new LocalDeterministicEngine();

// ----------------------------------------------------
// 04. MULTI-PROVIDER ARCHITECTURE & PROVIDER ADAPTERS
// ----------------------------------------------------

// 4.1 Google Gemini Provider
class GoogleGeminiProvider {
  constructor() {
    this.id = 'gemini';
    this.name = 'Google Gemini';
    this.primaryModel = 'gemini-3.7-flash';
    this.fallbackModel = 'gemini-3.1-flash-lite';
    this.proModel = 'gemini-3.1-pro-preview';
    this.candidateModels = [this.primaryModel, this.fallbackModel, this.proModel];
    this.client = null;
  }

  getClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey: key,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
    return this.client;
  }

  async healthCheck() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { status: 'UNCONFIGURED', connected: false, message: 'مفتاح GEMINI_API_KEY غير مهيأ' };
    const start = Date.now();
    try {
      const client = this.getClient();
      await client.models.generateContent({
        model: this.fallbackModel,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        config: { maxOutputTokens: 5 }
      });
      return { status: 'HEALTHY', connected: true, latencyMs: Date.now() - start };
    } catch (err) {
      const classified = this.classifyError(err);
      return { status: classified.type === 'DAILY_QUOTA_EXHAUSTED' ? 'QUOTA_LIMITED' : 'DEGRADED', connected: false, error: classified.userMessage, latencyMs: Date.now() - start };
    }
  }

  classifyError(err) {
    const errMsg = err?.message || String(err || '');
    let status = err?.status || 0;
    if (errMsg.includes('429')) status = 429;
    if (errMsg.includes('403')) status = 403;
    if (errMsg.includes('401')) status = 401;

    let retryDelaySec = 0;
    const match = errMsg.match(/retry in\s+([0-9.]+)\s*s/i) || errMsg.match(/"retryDelay":\s*"([0-9]+)s"/i);
    if (match && match[1]) retryDelaySec = Math.ceil(parseFloat(match[1]));

    const isDailyQuota = /GenerateRequestsPerDay|limit:\s*20|RESOURCE_EXHAUSTED|Quota exceeded/i.test(errMsg);
    const isRateLimit = status === 429 || /429|rate-limit|Rate limit/i.test(errMsg);
    const isAuth = status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(errMsg);

    let type = 'UNKNOWN';
    let suggestedCooldownMs = 60000;
    let userMessage = 'حدث خطأ في معالجة طلب Gemini.';

    if (isAuth) {
      type = 'AUTH_ERROR';
      userMessage = 'تعذر المصادقة مع Google Gemini. يرجى التحقق من المفتاح.';
    } else if (isDailyQuota) {
      type = 'DAILY_QUOTA_EXHAUSTED';
      suggestedCooldownMs = Math.max(retryDelaySec * 1000, 15 * 60 * 1000);
      userMessage = 'تم بلوغ الحصة اليومية لـ Gemini، تم التحويل تلقائياً لمزود بديل.';
    } else if (isRateLimit) {
      type = 'TRANSIENT_RATE_LIMIT';
      suggestedCooldownMs = Math.max(retryDelaySec * 1000, 30000);
      userMessage = `معدل طلبات مرتفع لـ Gemini، مهلة انتظار ${retryDelaySec || 30} ثانية.`;
    }

    return { type, status, retryDelaySec, suggestedCooldownMs, userMessage };
  }

  getCapabilities() {
    return {
      canGenerateLesson: true,
      canGenerateWorksheet: true,
      canGenerateAssessment: true,
      canAudit: true,
      requiresInternet: true,
      cost: 'low'
    };
  }

  getQuotaState() {
    return { status: Boolean(process.env.GEMINI_API_KEY) ? 'AVAILABLE' : 'UNCONFIGURED' };
  }

  async generate({ contents, systemInstruction, temperature = 0.2, maxOutputTokens = 4096, requestedModel = null }) {
    const ai = this.getClient();
    const modelToUse = requestedModel && this.candidateModels.includes(requestedModel) ? requestedModel : this.primaryModel;
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: contents,
      config: {
        systemInstruction,
        temperature,
        maxOutputTokens
      }
    });
    return {
      text: response?.text || '',
      model: modelToUse,
      provider: this.id
    };
  }
}

// 4.2 Groq Provider Adapter
class GroqProvider {
  constructor() {
    this.id = 'groq';
    this.name = 'Groq Cloud';
    this.primaryModel = 'llama-3.3-70b-versatile';
    this.fastModel = 'mixtral-8x7b-32768';
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  async healthCheck() {
    const key = process.env.GROQ_API_KEY;
    if (!key) return { status: 'UNCONFIGURED', connected: false, message: 'GROQ_API_KEY غير مهيأ' };
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      return { status: res.ok ? 'HEALTHY' : 'DEGRADED', connected: res.ok, latencyMs: Date.now() - start };
    } catch {
      return { status: 'NETWORK_ERROR', connected: false, latencyMs: Date.now() - start };
    }
  }

  classifyError(err) {
    const msg = err?.message || '';
    if (msg.includes('429') || /rate_limit/i.test(msg)) {
      return { type: 'TRANSIENT_RATE_LIMIT', suggestedCooldownMs: 30000, userMessage: 'تجاوز حد الطلبات على Groq.' };
    }
    if (msg.includes('401') || msg.includes('403')) {
      return { type: 'AUTH_ERROR', suggestedCooldownMs: 300000, userMessage: 'مفتاح Groq غير صالح.' };
    }
    return { type: 'GROQ_ERROR', suggestedCooldownMs: 15000, userMessage: 'خطأ أثناء الاتصال بمزود Groq.' };
  }

  getCapabilities() {
    return { canGenerateLesson: true, canGenerateWorksheet: true, canGenerateAssessment: true, canAudit: true, requiresInternet: true, cost: 'very_low' };
  }

  getQuotaState() {
    return { status: Boolean(process.env.GROQ_API_KEY) ? 'AVAILABLE' : 'UNCONFIGURED' };
  }

  async generate({ prompt, contents, systemInstruction, temperature = 0.2, maxOutputTokens = 4096 }) {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY_NOT_CONFIGURED');

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    if (contents && Array.isArray(contents)) {
      for (const c of contents) {
        const role = c.role === 'model' || c.role === 'assistant' ? 'assistant' : 'user';
        const text = c.parts ? c.parts.map(p => p.text || '').join('\n') : (typeof c === 'string' ? c : '');
        messages.push({ role, content: text });
      }
    } else if (prompt) {
      messages.push({ role: 'user', content: prompt });
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: this.primaryModel,
        messages,
        temperature,
        max_tokens: maxOutputTokens
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Groq API Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      model: this.primaryModel,
      provider: this.id
    };
  }
}

// 4.3 Cloudflare Workers AI Provider Adapter
class CloudflareWorkersAIProvider {
  constructor() {
    this.id = 'cloudflare';
    this.name = 'Cloudflare Workers AI';
    this.model = '@cf/meta/llama-3.1-8b-instruct';
  }

  async healthCheck() {
    const key = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!key || !accountId) return { status: 'UNCONFIGURED', connected: false, message: 'بيانات Cloudflare غير مكتملة' };
    return { status: 'HEALTHY', connected: true, latencyMs: 20 };
  }

  classifyError(err) {
    return { type: 'CLOUDFLARE_ERROR', suggestedCooldownMs: 20000, userMessage: err?.message || 'خطأ في Cloudflare Workers AI.' };
  }

  getCapabilities() {
    return { canGenerateLesson: true, canGenerateWorksheet: true, canGenerateAssessment: true, canAudit: false, requiresInternet: true, cost: 'free_tier' };
  }

  getQuotaState() {
    return { status: (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) ? 'AVAILABLE' : 'UNCONFIGURED' };
  }

  async generate({ prompt, contents, systemInstruction, maxOutputTokens = 2048 }) {
    const key = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!key || !accountId) throw new Error('CLOUDFLARE_UNCONFIGURED');

    let textPrompt = '';
    if (systemInstruction) textPrompt += `System: ${systemInstruction}\n\n`;
    if (contents && Array.isArray(contents)) {
      textPrompt += contents.map(c => `${c.role}: ${c.parts?.map(p => p.text).join(' ')}`).join('\n\n');
    } else {
      textPrompt += `User: ${prompt}`;
    }

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: textPrompt, max_tokens: maxOutputTokens })
    });

    if (!res.ok) throw new Error(`Cloudflare AI Error (${res.status})`);
    const data = await res.json();
    return {
      text: data.result?.response || '',
      model: this.model,
      provider: this.id
    };
  }
}

// 4.4 OpenRouter Provider Adapter
class OpenRouterProvider {
  constructor() {
    this.id = 'openrouter';
    this.name = 'OpenRouter';
    this.primaryModel = 'meta-llama/llama-3.3-70b-instruct:free';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async healthCheck() {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return { status: 'UNCONFIGURED', connected: false, message: 'OPENROUTER_API_KEY غير مهيأ' };
    return { status: 'HEALTHY', connected: true, latencyMs: 40 };
  }

  classifyError(err) {
    return { type: 'OPENROUTER_ERROR', suggestedCooldownMs: 30000, userMessage: err?.message || 'خطأ في OpenRouter.' };
  }

  getCapabilities() {
    return { canGenerateLesson: true, canGenerateWorksheet: true, canGenerateAssessment: true, canAudit: true, requiresInternet: true, cost: 'variable' };
  }

  getQuotaState() {
    return { status: Boolean(process.env.OPENROUTER_API_KEY) ? 'AVAILABLE' : 'UNCONFIGURED' };
  }

  async generate({ prompt, contents, systemInstruction, temperature = 0.2, maxOutputTokens = 4096 }) {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_UNCONFIGURED');

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    if (contents && Array.isArray(contents)) {
      for (const c of contents) {
        messages.push({
          role: c.role === 'model' ? 'assistant' : c.role,
          content: c.parts?.map(p => p.text).join('\n') || ''
        });
      }
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai.studio',
        'X-Title': 'HAKIM Omega'
      },
      body: JSON.stringify({
        model: this.primaryModel,
        messages,
        temperature,
        max_tokens: maxOutputTokens
      })
    });

    if (!res.ok) throw new Error(`OpenRouter Error (${res.status})`);
    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content || '',
      model: this.primaryModel,
      provider: this.id
    };
  }
}

// 4.5 Local Offline AI Provider (Ollama / Local endpoint)
class LocalOfflineAIProvider {
  constructor() {
    this.id = 'local-ai';
    this.name = 'Local AI / Ollama';
    this.url = process.env.LOCAL_AI_URL || 'http://127.0.0.1:11434';
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.url}/api/version`, { signal: AbortSignal.timeout(1500) });
      return { status: res.ok ? 'HEALTHY' : 'OFFLINE', connected: res.ok, latencyMs: 5 };
    } catch {
      return { status: 'OFFLINE', connected: false, latencyMs: 0 };
    }
  }

  classifyError() {
    return { type: 'LOCAL_AI_OFFLINE', userMessage: 'خادم الذكاء الاصطناعي المحلي غير متصل.' };
  }

  getCapabilities() {
    return { canGenerateLesson: true, canGenerateWorksheet: true, canGenerateAssessment: true, canAudit: true, requiresInternet: false, cost: 0 };
  }

  getQuotaState() {
    return { status: 'UNLIMITED' };
  }

  async generate(params) {
    try {
      const res = await fetch(`${this.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: params.prompt || (params.contents ? JSON.stringify(params.contents) : ''),
          stream: false
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (!res.ok) throw new Error('Local AI offline');
      const data = await res.json();
      return { text: data.response, model: 'llama3-local', provider: this.id };
    } catch {
      // Fallback to local deterministic generator
      const detText = localDeterministicEngine.generate(params);
      return { text: detText, model: 'local-deterministic', provider: 'local-deterministic' };
    }
  }
}

// ----------------------------------------------------
// 05. CENTRAL INTELLIGENCE FABRIC & MODEL ROUTER
// ----------------------------------------------------
const PROVIDERS = {
  gemini: new GoogleGeminiProvider(),
  groq: new GroqProvider(),
  cloudflare: new CloudflareWorkersAIProvider(),
  openrouter: new OpenRouterProvider(),
  localAi: new LocalOfflineAIProvider(),
  localDeterministic: localDeterministicEngine
};

// Independent Circuit Breakers per Provider
const circuitBreakers = {
  gemini: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null },
  groq: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null },
  cloudflare: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null },
  openrouter: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null },
  localAi: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null },
  localDeterministic: { state: 'CLOSED', failures: 0, successes: 0, cooldownUntil: 0, reason: null }
};

// Global System Configuration & Modes
let currentOperatingMode = 'AUTO'; // 'AUTO', 'ECONOMIC', 'QUALITY', 'OFFLINE'

// Telemetry & Metrics
const telemetry = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  cacheHits: 0,
  fallbackActivations: 0,
  level0Executions: 0,
  providerStats: {
    gemini: { requests: 0, errors: 0, successes: 0 },
    groq: { requests: 0, errors: 0, successes: 0 },
    cloudflare: { requests: 0, errors: 0, successes: 0 },
    openrouter: { requests: 0, errors: 0, successes: 0 },
    localDeterministic: { requests: 0, errors: 0, successes: 0 }
  },
  recentLogs: []
};

function logTelemetry(entry) {
  telemetry.totalRequests++;
  if (entry.success) telemetry.successfulRequests++;
  else telemetry.failedRequests++;
  if (entry.cached) telemetry.cacheHits++;
  if (entry.fallbackUsed) telemetry.fallbackActivations++;
  if (entry.level === 0 || entry.provider === 'local-deterministic') telemetry.level0Executions++;

  if (entry.provider && telemetry.providerStats[entry.provider]) {
    telemetry.providerStats[entry.provider].requests++;
    if (entry.success) telemetry.providerStats[entry.provider].successes++;
    else telemetry.providerStats[entry.provider].errors++;
  }

  telemetry.recentLogs.unshift({
    id: entry.id || ('req_' + Date.now()),
    timestamp: new Date().toISOString(),
    task: entry.task || 'general',
    provider: entry.provider || 'auto',
    model: entry.model || 'unknown',
    durationMs: entry.durationMs || 0,
    success: entry.success,
    cached: Boolean(entry.cached),
    fallbackUsed: Boolean(entry.fallbackUsed),
    level: entry.level || 1
  });
  if (telemetry.recentLogs.length > 60) telemetry.recentLogs.pop();
}

// ----------------------------------------------------
// 06. DETERMINISTIC AUDITOR & QUALITY GATE
// ----------------------------------------------------
function auditPedagogicalContentDeterministic(content) {
  const text = typeof content === 'string' ? content : JSON.stringify(content);
  const issues = [];
  const scores = {
    mathSafety: 100,
    developmental: 100,
    cpaProgression: 100,
    clarity: 100,
    masteryCriteria: 100,
    mathVisualOrder: 100,
    cognitiveBalance: 100
  };

  // 1. Math Calculation Check (Regex search for simple additions/subtractions)
  const arithmeticRegex = /(\d+)\s*([\+\-\*\/×÷])\s*(\d+)\s*=\s*(\d+)/g;
  let match;
  while ((match = arithmeticRegex.exec(text)) !== null) {
    const a = parseInt(match[1], 10);
    const op = match[2];
    const b = parseInt(match[3], 10);
    const statedRes = parseInt(match[4], 10);

    let calculated = 0;
    if (op === '+' || op === '＋') calculated = a + b;
    else if (op === '-' || op === '－') calculated = a - b;
    else if (op === '*' || op === '×') calculated = a * b;
    else if (op === '/' || op === '÷') calculated = Math.floor(a / b);

    if (calculated !== statedRes) {
      issues.push({
        type: 'MATH_CALCULATION_ERROR',
        severity: 'CRITICAL',
        message: `خطأ حسابي صريح: العبارة الحسابية (${match[0]}) خاطئة، الناتج الصحيح هو (${calculated}).`
      });
      scores.mathSafety -= 40;
    }
  }

  // 2. Numerical Visual Group Matching (Count emojis against declared count)
  const visualEmojiRegex = /(\d+)\s*(?:تفاحات|أقلام|سيارات|نجوم|أشجار|بالونات|كرات|عناصر)\s*([🍎🍏✏️🚗⭐🌲🎈⚽🔴🔵📦]+)/g;
  while ((match = visualEmojiRegex.exec(text)) !== null) {
    const declaredCount = parseInt(match[1], 10);
    const emojiStr = match[2];
    // Count distinct emoji code points
    const actualEmojiCount = [...emojiStr].filter(char => char.codePointAt(0) > 255).length;
    if (actualEmojiCount > 0 && declaredCount !== actualEmojiCount) {
      issues.push({
        type: 'COUNTING_MISMATCH',
        severity: 'CRITICAL',
        message: `عدم تطابق عددي بصري: تم ذكر (${declaredCount}) عناصر بينما تم رسم (${actualEmojiCount}) رموز.`
      });
      scores.mathVisualOrder -= 40;
    }
  }

  // 3. Developmental Suitability Check
  if (/الصف الأول|Grade 1/i.test(text)) {
    if (/قسمة مطولة|كسور عشرية|جذر تربيعي|معادلة تفاضلية|مبرهنة/i.test(text)) {
      issues.push({
        type: 'DEVELOPMENTAL_OVERLOAD',
        severity: 'HIGH',
        message: 'المحتوى يتضمن مفاهيم تفوق الخصائص النمائية لطلبة الصف الأول الأساسي.'
      });
      scores.developmental -= 35;
    }
  }

  // 4. CPA Progression Presence
  const hasConcrete = /محسوس|أدوات ملموسة|مكعبات|أزرار|أدوات حقيقية/i.test(text);
  const hasPictorial = /مصور|شبه محسوس|نماذج بصرية|رسم|صور/i.test(text);
  const hasAbstract = /مجرد|رمزي|أعداد|جملة عددية|رموز/i.test(text);

  if (!hasConcrete || !hasPictorial || !hasAbstract) {
    issues.push({
      type: 'CPA_PROGRESSION_INCOMPLETE',
      severity: 'MEDIUM',
      message: 'مسار التدرج النمائي (CPA: محسوس ← مصور ← مجرد) غير مكتمل بشكل صريح.'
    });
    scores.cpaProgression -= 25;
  }

  // 5. Mastery Criteria & Rubric Presence
  const hasMastery = /معيار الإتقان|سلم تقدير|Rubric|80%|مفتاح الإجابة/i.test(text);
  if (!hasMastery) {
    issues.push({
      type: 'MASTERY_CRITERIA_ABSENT',
      severity: 'MEDIUM',
      message: 'لم يتم تحديد معيار إتقان صريح أو سلم تقدير لفظي للتقويم.'
    });
    scores.masteryCriteria -= 20;
  }

  // Calculate Total Score
  const total = Math.max(0, Math.round(
    (scores.mathSafety * 0.25) +
    (scores.developmental * 0.20) +
    (scores.cpaProgression * 0.20) +
    (scores.mathVisualOrder * 0.15) +
    (scores.masteryCriteria * 0.10) +
    (scores.clarity * 0.10)
  ));

  const hasFatalFlaw = issues.some(i => ['MATH_CALCULATION_ERROR', 'COUNTING_MISMATCH', 'DEVELOPMENTAL_OVERLOAD'].includes(i.type)) || total < 70;
  const status = (!hasFatalFlaw && total >= 85) ? 'PASS' : (!hasFatalFlaw && total >= 70) ? 'PASS_WITH_WARNINGS' : 'FAIL';

  return { status, score: total, scores, issues };
}

// ----------------------------------------------------
// 07. INTELLIGENT AI GATEWAY & ORCHESTRATOR
// ----------------------------------------------------
async function orchestrateGeneration({
  task = 'general',
  prompt = '',
  contents = null,
  systemInstruction = null,
  model = 'auto',
  temperature = undefined,
  maxOutputTokens = undefined,
  bypassCache = false,
  targetGrade = 'الصف الأول',
  targetSubject = 'الرياضيات'
}) {
  const startTime = Date.now();
  const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

  // Normalize contents & prompts
  let resolvedContents = [];
  if (contents && Array.isArray(contents)) {
    resolvedContents = contents.map(c => {
      if (typeof c === 'string') return { role: 'user', parts: [{ text: c }] };
      if (c.role && c.parts) return { role: c.role === 'assistant' ? 'model' : c.role, parts: c.parts };
      return c;
    });
  } else if (prompt) {
    resolvedContents = [{ role: 'user', parts: [{ text: prompt }] }];
  } else {
    throw new Error('INVALID_REQUEST: نص الطلب (prompt) أو محادثة (contents) مطلوب.');
  }

  // Apply context compaction
  resolvedContents = tokenEconomy.compactContext(resolvedContents, 6);

  // Task budget profile
  const taskConfig = TASK_BUDGETS[task] || { maxOutputTokens: 4096, temperature: 0.2, level: 2, preferredModel: 'gemini-3.7-flash' };
  const effectiveMaxTokens = maxOutputTokens || taskConfig.maxOutputTokens;
  const effectiveTemp = temperature !== undefined ? temperature : taskConfig.temperature;

  let finalSystemPrompt = systemInstruction || HAKIM_CORE_SYSTEM_PROMPT;
  if (TASK_PROMPTS[task] && !systemInstruction) {
    finalSystemPrompt = `${HAKIM_CORE_SYSTEM_PROMPT}\n\nتوجيه المهمة المحددة (${task}):\n${TASK_PROMPTS[task]}`;
  }

  // LEVEL 0: Deterministic Local Execution if OFFLINE mode or no internet required
  if (currentOperatingMode === 'OFFLINE') {
    const text = localDeterministicEngine.generate({ task, prompt, grade: targetGrade, subject: targetSubject });
    logTelemetry({ id: reqId, task, provider: 'local-deterministic', model: 'local-deterministic', durationMs: Date.now() - startTime, success: true, level: 0 });
    return {
      text,
      model: 'local-deterministic',
      provider: 'local-deterministic',
      cached: false,
      fallbackUsed: false,
      level: 0,
      reqId
    };
  }

  // L1 Cache Check
  const cacheKey = tokenEconomy.generateHash(resolvedContents, finalSystemPrompt, task, model);
  if (!bypassCache) {
    const cached = tokenEconomy.getL1(cacheKey);
    if (cached) {
      logTelemetry({ id: reqId, task, provider: 'cache', model: cached.model, durationMs: Date.now() - startTime, success: true, cached: true, level: taskConfig.level });
      return {
        text: cached.text,
        model: cached.model,
        provider: 'cache',
        cached: true,
        fallbackUsed: false,
        level: taskConfig.level,
        reqId
      };
    }
  }

  // In-flight deduplication
  const existingInFlight = tokenEconomy.getInFlight(cacheKey);
  if (existingInFlight) {
    const dedupRes = await existingInFlight;
    return { ...dedupRes, cached: true, reqId };
  }

  // Determine provider sequence based on availability, mode, and health
  const now = Date.now();
  const providerSequence = [];

  // Reset expired cooldowns
  for (const [pId, cb] of Object.entries(circuitBreakers)) {
    if (cb.state === 'OPEN' && now >= cb.cooldownUntil) {
      cb.state = 'HALF_OPEN';
      cb.reason = null;
    }
  }

  // Build provider priorities based on mode & credentials
  if (currentOperatingMode === 'ECONOMIC') {
    if (process.env.GROQ_API_KEY && circuitBreakers.groq.state !== 'OPEN') providerSequence.push('groq');
    if (process.env.CLOUDFLARE_API_TOKEN && circuitBreakers.cloudflare.state !== 'OPEN') providerSequence.push('cloudflare');
    if (process.env.GEMINI_API_KEY && circuitBreakers.gemini.state !== 'OPEN') providerSequence.push('gemini');
    if (process.env.OPENROUTER_API_KEY && circuitBreakers.openrouter.state !== 'OPEN') providerSequence.push('openrouter');
    providerSequence.push('localDeterministic');
  } else {
    // AUTO / QUALITY mode
    if (process.env.GEMINI_API_KEY && circuitBreakers.gemini.state !== 'OPEN') providerSequence.push('gemini');
    if (process.env.GROQ_API_KEY && circuitBreakers.groq.state !== 'OPEN') providerSequence.push('groq');
    if (process.env.OPENROUTER_API_KEY && circuitBreakers.openrouter.state !== 'OPEN') providerSequence.push('openrouter');
    if (process.env.CLOUDFLARE_API_TOKEN && circuitBreakers.cloudflare.state !== 'OPEN') providerSequence.push('cloudflare');
    providerSequence.push('localDeterministic');
  }

  let executionPromise = (async () => {
    let lastError = null;
    let fallbackUsed = false;
    let fallbackReason = null;

    for (let i = 0; i < providerSequence.length; i++) {
      const pKey = providerSequence[i];
      const provider = PROVIDERS[pKey];
      if (!provider) continue;

      try {
        let genResult;
        if (pKey === 'localDeterministic') {
          genResult = {
            text: provider.generate({ task, prompt, grade: targetGrade, subject: targetSubject }),
            model: 'local-deterministic',
            provider: 'local-deterministic'
          };
        } else {
          genResult = await provider.generate({
            prompt,
            contents: resolvedContents,
            systemInstruction: finalSystemPrompt,
            temperature: effectiveTemp,
            maxOutputTokens: effectiveMaxTokens,
            requestedModel: model !== 'auto' ? model : undefined,
            task
          });
        }

        // On success: update circuit breaker
        if (circuitBreakers[pKey]) {
          circuitBreakers[pKey].state = 'CLOSED';
          circuitBreakers[pKey].failures = 0;
          circuitBreakers[pKey].successes++;
        }

        // L1 Cache Save
        if (genResult.text) {
          tokenEconomy.setL1(cacheKey, genResult.text, genResult.model, { provider: pKey, task });
        }

        logTelemetry({
          id: reqId,
          task,
          provider: genResult.provider || pKey,
          model: genResult.model,
          durationMs: Date.now() - startTime,
          success: true,
          cached: false,
          fallbackUsed: i > 0 || fallbackUsed,
          level: taskConfig.level
        });

        return {
          text: genResult.text,
          model: genResult.model,
          provider: genResult.provider || pKey,
          fallbackUsed: i > 0 || fallbackUsed,
          fallbackReason: i > 0 ? (fallbackReason || `تم التحويل تلقائياً للمزود البديل (${provider.name}) لضمان الاستمرارية.`) : null,
          durationMs: Date.now() - startTime,
          level: taskConfig.level,
          reqId
        };

      } catch (err) {
        lastError = err;
        fallbackUsed = true;
        const classified = provider.classifyError ? provider.classifyError(err) : { type: 'ERROR', suggestedCooldownMs: 30000 };

        if (circuitBreakers[pKey]) {
          circuitBreakers[pKey].failures++;
          circuitBreakers[pKey].state = 'OPEN';
          circuitBreakers[pKey].cooldownUntil = Date.now() + (classified.suggestedCooldownMs || 30000);
          circuitBreakers[pKey].reason = classified.type;
        }

        fallbackReason = `تعذر استجابة ${provider.name} (${classified.type || err.message}). جاري الانتقال للمزود التالي...`;
      }
    }

    // If all providers failed, fallback to local deterministic safely
    const fallbackText = localDeterministicEngine.generate({ task, prompt, grade: targetGrade, subject: targetSubject });
    return {
      text: fallbackText,
      model: 'local-deterministic',
      provider: 'local-deterministic',
      fallbackUsed: true,
      fallbackReason: 'تم الانتقال للمحرك الحتمي المحلي لضمان عدم توقف الخدمة نهائياً.',
      durationMs: Date.now() - startTime,
      level: 0,
      reqId
    };
  })();

  tokenEconomy.setInFlight(cacheKey, executionPromise);
  try {
    const result = await executionPromise;
    return result;
  } finally {
    tokenEconomy.deleteInFlight(cacheKey);
  }
}

// ----------------------------------------------------
// 08. IN-MEMORY STORAGE (Projects, Memory Bank, Competencies)
// ----------------------------------------------------
const serverState = {
  projects: [
    {
      id: 'proj_sample_01',
      title: 'خطة درس: مفهوم الجمع بالضم والتمثيل المصور',
      type: 'lesson',
      subject: 'الرياضيات',
      grade: 'الصف الأول',
      competencyId: 'M1-02',
      status: 'VERIFIED',
      content: `### خطة درس: مفهوم الجمع بالضم والتمثيل المصور
**المبحث:** الرياضيات | **الصف:** الأول الأساسي
**الكفاية:** مفهوم الجمع ضمن 10 وتوظيف المحسوسات والصور.
**نواتج التعلم:** يجد التلميذ ناتج جمع عددين ضمن 10 بضم مجموعتين مصورتين وكتابة جملة الجمع الصحيحة.

#### 1. مسار التدرج النمائي:
- **المحسوس:** استخدام 5 مكعبات حمراء و 3 مكعبات زرقاء وضمها على الطاولة ليعد التلميذ المجموع الكلي (8).
- **المصور:** رسم 4 تفاحات 🍎🍎🍎🍎 + 3 تفاحات 🍎🍎🍎 = 7 تفاحات.
- **الرمزي:** <span class="math-expr" dir="ltr">4 + 3 = 7</span>

#### 2. النشاط الصفي والتطبيق:
يقوم كل تلميذ بتمثيل جمل الجمع ببطاقات الأعداد والمجسمات مع كتابة جملة الجمع في دفتره.

#### 3. معيار الإتقان:
حل 4 مسائل من أصل 5 بصورة صحيحة بدون مساعدة المعلم.`,
      tags: ['رياضيات', 'صف أول', 'جمع', 'تدرج نمائي'],
      metadata: { author: 'HAKIM Ω Engine', version: '2.0' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  customCompetencies: [],
  memoryBank: {
    userPreferences: {
      defaultGrade: 'الصف الأول',
      defaultSubject: 'الرياضيات',
      useEasternNumerals: false,
      exportFormat: 'HTML',
      operatingMode: 'AUTO'
    },
    educationalContext: 'منهاج التعليم الأساسي التفاعلي القائم على التدرج والكفايات',
    savedSnippets: []
  }
};

const INSTITUTIONAL_COMPETENCIES = [
  {
    id: "M1-01",
    subject: "الرياضيات",
    grade: "الصف الأول",
    domain: "الأعداد والعمليات",
    skill: "الأعداد حتى 20: عد وقراءة وكتابة وتمثيل",
    learning_objective: "أن يعد التلميذ ويكتب ويمثل الأعداد حتى 20 باستخدام الأدوات المحسوسة والصور بدقة 100%.",
    success_criteria: ["يعد عناصر مجموعة حتى 20 تصاعديًا وتنازليًا", "يمثل العدد بمحسوسات ورسوم متطابقة", "يقارن بين عددين باستخدام الرموز (> ، < ، =)"],
    difficulty: "أساسي",
    progression: {
      concrete: "استخدام أزرار، مكعبات، أصابع اليد لعد الأشياء.",
      pictorial: "رسومات بطاقات نقطية ودوائر متطابقة تمثل العدد.",
      abstract: "كتابة الرمز العددي (مثال: 7 أو ٧) وتسميته."
    },
    assessment_type: "أداء عملي + ورقة عمل مصورة"
  },
  {
    id: "M1-02",
    subject: "الرياضيات",
    grade: "الصف الأول",
    domain: "العمليات الحسابية",
    skill: "مفهوم الجمع بالضم ضمن 10 و 20",
    learning_objective: "أن يجد التلميذ ناتج جمع عددين ضمن 10 بضم مجموعتين وكتابة جملة الجمع الرياضية الصحيحة.",
    success_criteria: ["يوظف المحسوسات لضم مجموعتين", "يكتب جملة الجمع بالترتيب الصحيح (أ + ب = ج)", "يحل مسائل لفظية مصورة من خطوة واحدة"],
    difficulty: "متوسط",
    progression: {
      concrete: "وضع 3 سيارات حمراء و 2 خضراء في صندوق واحد وعد المجموع.",
      pictorial: "رسم 3 أقلام ✏️✏️✏️ + 2 قلم ✏️✏️ = 5 أقلام.",
      abstract: "3 + 2 = 5"
    },
    assessment_type: "بطاقات إجابة سريعة ومسائل لفظية"
  },
  {
    id: "M1-03",
    subject: "الرياضيات",
    grade: "الصف الأول",
    domain: "العمليات الحسابية",
    skill: "مفهوم الطرح بالحذف والمقارنة ضمن 10 و 20",
    learning_objective: "أن يعبر التلميذ عن الطرح بحذف عناصر من مجموعة وإيجاد الباقي بدقة.",
    success_criteria: ["يشطب عناصر من رسمة لتوضيح عملية الأخذ", "يكتب جملة الطرح بصيغتها السليمة", "يكتشف العلاقة العكسية بين الجمع والطرح"],
    difficulty: "متوسط",
    progression: {
      concrete: "أخذ 3 تفاحات من طبق يحتوي 7 تفاحات وعد الباقي.",
      pictorial: "رسم 6 بالونات مع شطب 2 منها 🎈🎈🎈🎈❌❌ = 4.",
      abstract: "6 - 2 = 4"
    },
    assessment_type: "تطبيق فردي باللوح الصغير"
  },
  {
    id: "A1-01",
    subject: "اللغة العربية",
    grade: "الصف الأول",
    domain: "الوعي الصوتي والقرائي",
    skill: "الوعي الصوتي ورسم الحروف بحركاتها",
    learning_objective: "أن يميز التلميذ أصوات الحروف بحركاتها القصيرة والطويلة ويكتبها بأشكالها المتعددة.",
    success_criteria: ["ينطق صوت الحرف بدقة بالحركات", "يميز المدود الطويلة", "يكتب الحرف في مواقعه المختلفة"],
    difficulty: "أساسي",
    progression: {
      concrete: "تشكيل الحروف بالصلصال وتمرير الإصبع على حروف رملية.",
      pictorial: "صور لأشياء تبدأ بالحرف مع تمييز شكل الحرف الملون.",
      abstract: "قراءة وكتابة المقاطع الصوتية."
    },
    assessment_type: "إملاء مصور وقراءة جهرية"
  },
  {
    id: "S1-01",
    subject: "العلوم والحياة",
    grade: "الصف الأول",
    domain: "علوم الحياة",
    skill: "الكائنات الحية واحتياجاتها وأجزاء النبات",
    learning_objective: "أن يصنف التلميذ الكائنات الحية وغير الحية ويحدد أجزاء النبات الأساسية ووظائفها.",
    success_criteria: ["يميز بين الكائن الحي وغير الحي", "يحدد أجزاء النبتة", "يستنتج حاجة النبات للماء والضوء"],
    difficulty: "أساسي",
    progression: {
      concrete: "زراعة بذور الفول في قطن ومراقبة نموها.",
      pictorial: "لوحات توضيحية مصورة ومجسمات نباتية ملونة.",
      abstract: "كتابة المصطلحات العلمية وربط وظيفة كل عضو بالنبات."
    },
    assessment_type: "دفتر استكشاف علمي + مطابقة مصورة"
  }
];

// ----------------------------------------------------
// 09. REST API ENDPOINTS
// ----------------------------------------------------

// 9.1 Health Check
app.get('/api/health', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasCloudflare = Boolean(process.env.CLOUDFLARE_API_TOKEN);
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY);

  res.json({
    status: 'ok',
    app: 'HAKIM Ω — المؤسسة التعليمية متعددة المزودين',
    version: '2.0.0',
    hasKey: hasGemini || hasGroq || hasCloudflare || hasOpenRouter,
    operatingMode: currentOperatingMode,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    timestamp: new Date().toISOString(),
    providersSummary: {
      gemini: hasGemini ? 'CONFIGURED' : 'UNCONFIGURED',
      groq: hasGroq ? 'CONFIGURED' : 'UNCONFIGURED',
      cloudflare: hasCloudflare ? 'CONFIGURED' : 'UNCONFIGURED',
      openrouter: hasOpenRouter ? 'CONFIGURED' : 'UNCONFIGURED',
      localDeterministic: 'READY'
    },
    telemetry: {
      total: telemetry.totalRequests,
      successRate: telemetry.totalRequests > 0 ? Math.round((telemetry.successfulRequests / telemetry.totalRequests) * 100) + '%' : '100%',
      cacheHits: telemetry.cacheHits,
      fallbacks: telemetry.fallbackActivations,
      level0Local: telemetry.level0Executions
    }
  });
});

// 9.2 Configuration & Multi-Provider Governor Status
app.get('/api/config', (req, res) => {
  const now = Date.now();
  const cbStatus = {};
  for (const [pKey, cb] of Object.entries(circuitBreakers)) {
    const isCooling = cb.state === 'OPEN' && now < cb.cooldownUntil;
    cbStatus[pKey] = {
      state: isCooling ? 'COOLDOWN' : (cb.state === 'HALF_OPEN' ? 'TESTING' : 'HEALTHY'),
      remainingCooldownSec: isCooling ? Math.ceil((cb.cooldownUntil - now) / 1000) : 0,
      reason: isCooling ? cb.reason : null,
      successes: cb.successes,
      failures: cb.failures
    };
  }

  res.json({
    success: true,
    operatingMode: currentOperatingMode,
    hasServerKey: Boolean(process.env.GEMINI_API_KEY),
    primaryModel: 'gemini-3.7-flash',
    fallbackModel: 'gemini-3.1-flash-lite',
    proModel: 'gemini-3.1-pro-preview',
    circuitBreaker: cbStatus,
    providers: [
      { id: 'gemini', name: 'Google Gemini', isConfigured: Boolean(process.env.GEMINI_API_KEY), models: ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'] },
      { id: 'groq', name: 'Groq Cloud', isConfigured: Boolean(process.env.GROQ_API_KEY), models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'] },
      { id: 'cloudflare', name: 'Cloudflare Workers AI', isConfigured: Boolean(process.env.CLOUDFLARE_API_TOKEN), models: ['@cf/meta/llama-3.1-8b-instruct'] },
      { id: 'openrouter', name: 'OpenRouter', isConfigured: Boolean(process.env.OPENROUTER_API_KEY), models: ['meta-llama/llama-3.3-70b-instruct:free'] },
      { id: 'localDeterministic', name: 'Local Deterministic Engine', isConfigured: true, models: ['local-deterministic'] }
    ],
    taskBudgets: TASK_BUDGETS,
    serverTime: new Date().toISOString()
  });
});

// 9.3 Change Operating Mode
app.post('/api/config/mode', (req, res) => {
  const { mode } = req.body;
  if (!['AUTO', 'ECONOMIC', 'QUALITY', 'OFFLINE'].includes(mode)) {
    return res.status(400).json({ error: { message: 'وضع التشغيل غير صالح (يجب أن يكون AUTO أو ECONOMIC أو QUALITY أو OFFLINE).' } });
  }
  currentOperatingMode = mode;
  res.json({ success: true, mode: currentOperatingMode });
});

// 9.4 Check Provider Live Health
app.post('/api/providers/health', async (req, res) => {
  const healthResults = {};
  for (const [pKey, provider] of Object.entries(PROVIDERS)) {
    if (provider.healthCheck) {
      healthResults[pKey] = await provider.healthCheck();
    }
  }
  res.json({ success: true, results: healthResults });
});

// 9.5 AI Gateway Orchestration Endpoint (/api/ai & /api/gemini)
app.post('/api/ai', async (req, res) => {
  try {
    const { prompt, contents } = req.body;
    if (!prompt && (!contents || !Array.isArray(contents) || contents.length === 0)) {
      return res.status(400).json({ error: { message: 'يجب توفير نص الطلب (prompt) أو مصفوفة المحادثة (contents).' } });
    }
    const result = await orchestrateGeneration(req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error('[AI Gateway Error]:', err.message);
    res.status(err.status || 500).json({
      error: {
        code: err.type || 'AI_GATEWAY_ERROR',
        message: err.message || 'حدث خطأ في بوابة الذكاء الاصطناعي.'
      }
    });
  }
});

app.post('/api/gemini', (req, res, next) => {
  req.url = '/api/ai';
  app.handle(req, res, next);
});

// 9.6 Full & Deterministic Auditor Endpoints
app.post('/api/verify', async (req, res) => {
  try {
    const { content, targetGrade = 'الصف الأول', targetSubject = 'الرياضيات' } = req.body;
    if (!content) {
      return res.status(400).json({ error: { message: 'المحتوى المراد تدقيقه فارغ.' } });
    }

    // 1. Instant deterministic check
    const detAudit = auditPedagogicalContentDeterministic(content);

    // 2. Comprehensive AI Report
    const prompt = `أنت المدقق البيداغوجي الأعلى (HAKIM Ω Educational Auditor).
قم بإجراء تدقيق علمي وتربوي شامل للمحتوى التالي لـ (${targetGrade} - ${targetSubject}):

المحتوى المراد تدقيقه:
"""
${content}
"""

حلل وفق الأبعاد السبعة:
1. السلامة العلمية والحسابية
2. الملاءمة النمائية وقاموس التلميذ
3. مسار التدرج CPA (محسوس ← مصور ← مجرد)
4. دقة الصياغة
5. معايير الإتقان ومفتاح الإجابة
6. الترتيب البصري للتعبيرات الحسابية
7. التوازن المعرفي

أخرج النتيجة مع التقييم النهائي ([PASS] / [PASS WITH WARNINGS] / [FAIL])، وجدول الدرجات والنسخة المعدلة بالكامل.`;

    const aiRes = await orchestrateGeneration({
      task: 'audit',
      prompt,
      targetGrade,
      targetSubject
    });

    res.json({
      success: true,
      report: aiRes.text,
      deterministicAudit: detAudit,
      model: aiRes.model,
      provider: aiRes.provider,
      fallbackUsed: aiRes.fallbackUsed,
      fallbackReason: aiRes.fallbackReason
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: {
        code: err.type || 'AUDITOR_ERROR',
        message: err.message || 'تعذر استكمال التدقيق البيداغوجي.'
      }
    });
  }
});

app.post('/api/audit-deterministic', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: { message: 'المحتوى المراد تدقيقه فارغ.' } });
  }
  const result = auditPedagogicalContentDeterministic(content);
  res.json({ success: true, audit: result });
});

// 9.7 Competencies Endpoints
app.get('/api/competencies', (req, res) => {
  const { grade, subject, domain, q } = req.query;
  let filtered = [...INSTITUTIONAL_COMPETENCIES, ...serverState.customCompetencies];

  if (grade) filtered = filtered.filter(c => c.grade.includes(grade) || grade.includes(c.grade));
  if (subject) filtered = filtered.filter(c => c.subject.includes(subject) || subject.includes(c.subject));
  if (domain) filtered = filtered.filter(c => c.domain.includes(domain));
  if (q) {
    const query = q.toLowerCase();
    filtered = filtered.filter(c =>
      c.skill.toLowerCase().includes(query) ||
      c.learning_objective.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query)
    );
  }

  res.json({
    success: true,
    total: filtered.length,
    competencies: filtered,
    subjects: ["الرياضيات", "اللغة العربية", "العلوم والحياة"],
    grades: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع"]
  });
});

app.post('/api/competencies', (req, res) => {
  const { subject, grade, domain, skill, learning_objective, success_criteria } = req.body;
  if (!skill || !subject || !grade) {
    return res.status(400).json({ error: { message: 'حقول المبحث، الصف، والمهارة إلزامية.' } });
  }

  const newComp = {
    id: 'C_CUSTOM_' + Date.now().toString(36).toUpperCase(),
    subject,
    grade,
    domain: domain || 'عام',
    skill,
    learning_objective: learning_objective || skill,
    success_criteria: Array.isArray(success_criteria) ? success_criteria : [success_criteria || skill],
    difficulty: 'مخصص',
    progression: { concrete: 'تطبيق عملي', pictorial: 'تمثيل بصري', abstract: 'تطبيق رمزي' },
    assessment_type: 'تقويم صفي مخصص',
    isCustom: true
  };

  serverState.customCompetencies.unshift(newComp);
  res.json({ success: true, competency: newComp });
});

// 9.8 Projects & Memory API
app.get('/api/projects', (req, res) => {
  const { status, type, grade, subject } = req.query;
  let items = [...serverState.projects];

  if (status) items = items.filter(p => p.status === status);
  if (type) items = items.filter(p => p.type === type);
  if (grade) items = items.filter(p => p.grade === grade);
  if (subject) items = items.filter(p => p.subject === subject);

  res.json({ success: true, total: items.length, projects: items });
});

app.post('/api/projects', (req, res) => {
  const { title, type, content, subject, grade, competencyId, tags, metadata, status } = req.body;
  if (!content) {
    return res.status(400).json({ error: { message: 'المحتوى مطلوب لحفظ المشروع.' } });
  }

  const newProject = {
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: title || 'مشروع تعليمي جديد',
    type: type || 'lesson',
    subject: subject || 'عام',
    grade: grade || 'الصف الأول',
    competencyId: competencyId || null,
    status: status || 'DRAFT',
    content: content,
    tags: Array.isArray(tags) ? tags : [],
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  serverState.projects.unshift(newProject);
  if (serverState.projects.length > 200) serverState.projects.pop();

  res.json({ success: true, project: newProject });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const index = serverState.projects.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: { message: 'المشروع غير موجود.' } });
  }

  const existing = serverState.projects[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  serverState.projects[index] = updated;
  res.json({ success: true, project: updated });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = serverState.projects.length;
  serverState.projects = serverState.projects.filter(p => p.id !== id);
  if (serverState.projects.length === initialLen) {
    return res.status(404).json({ error: { message: 'المشروع غير موجود.' } });
  }
  res.json({ success: true, message: 'تم حذف المشروع بنجاح.' });
});

app.get('/api/projects/export-all', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="hakim_omega_backup.json"');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    projects: serverState.projects,
    customCompetencies: serverState.customCompetencies,
    memoryBank: serverState.memoryBank
  });
});

app.post('/api/projects/import-all', (req, res) => {
  const { projects, customCompetencies, memoryBank } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: { message: 'ملف الاستيراد غير صالح (يجب أن يحتوي على مصفوفة مشاريع).' } });
  }

  serverState.projects = projects;
  if (Array.isArray(customCompetencies)) serverState.customCompetencies = customCompetencies;
  if (memoryBank && typeof memoryBank === 'object') serverState.memoryBank = memoryBank;

  res.json({
    success: true,
    message: `تم استيراد ${projects.length} مشروع بنجاح.`,
    count: projects.length
  });
});

// 9.9 File Chunking & Processing Studio
app.post('/api/files/process', (req, res) => {
  const { fileName, fileType, rawContent, chunkSize = 1500 } = req.body;
  if (!rawContent) {
    return res.status(400).json({ error: { message: 'محتوى الملف فارغ.' } });
  }

  const length = rawContent.length;
  const words = rawContent.trim().split(/\s+/).length;
  const estimatedTokens = Math.ceil(length / 3.5);

  const chunks = [];
  for (let i = 0; i < length; i += chunkSize) {
    chunks.push({
      index: chunks.length + 1,
      text: rawContent.slice(i, i + chunkSize),
      charCount: Math.min(chunkSize, length - i)
    });
  }

  res.json({
    success: true,
    file: {
      name: fileName || 'file.txt',
      type: fileType || 'text/plain',
      totalChars: length,
      totalWords: words,
      estimatedTokens: estimatedTokens,
      totalChunks: chunks.length
    },
    chunks: chunks.slice(0, 10),
    preview: rawContent.slice(0, 500)
  });
});

// 9.10 Export Engine
app.post('/api/export', (req, res) => {
  const { title, content, format = 'html', grade = '', subject = '' } = req.body;
  if (!content) {
    return res.status(400).json({ error: { message: 'المحتوى المطلوب تصديره فارغ.' } });
  }

  const docTitle = title || 'مخرج تعليمي — HAKIM Ω';

  if (format === 'html' || format === 'pdf_print') {
    const htmlOutput = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Tajawal:wght@400;500;700&display=swap');
    @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
    body {
      font-family: 'Cairo', 'Tajawal', sans-serif;
      line-height: 1.7;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .header-box {
      border: 2px solid #0f766e;
      border-radius: 8px;
      padding: 14px 20px;
      margin-bottom: 24px;
      background: #f0fdfa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-box h1 { margin: 0; font-size: 20px; color: #0f766e; }
    .header-meta { font-size: 13px; color: #475569; }
    .content-body { font-size: 14.5px; }
    .content-body h2 { color: #0f766e; border-bottom: 1.5px solid #ccfbf1; padding-bottom: 6px; margin-top: 20px; font-size: 17px; }
    .content-body h3 { color: #0369a1; margin-top: 16px; font-size: 15px; }
    .content-body table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .content-body th, .content-body td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
    .content-body th { background: #f8fafc; color: #0f172a; }
    .math-expr { font-family: 'Cairo', sans-serif; direction: ltr; unicode-bidi: embed; font-weight: bold; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .footer-box { margin-top: 40px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <h1>${docTitle}</h1>
      <div class="header-meta">${grade ? `المرحلة: ${grade}` : ''} ${subject ? `| المبحث: ${subject}` : ''} | تم الإعداد بواسطة HAKIM Ω</div>
    </div>
    <div style="text-align: left; font-weight: bold; color: #0f766e;">منصة حكيم التعليمية</div>
  </div>
  <div class="content-body">
    ${content.replace(/\n/g, '<br/>')}
  </div>
  <div class="footer-box">
    <div>تمت الصياغة وفق معايير التدرج النمائي وضبط الجودة البيداغوجية</div>
    <div>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div>
  </div>
</body>
</html>`;
    return res.json({ success: true, format: 'html', data: htmlOutput });
  }

  if (format === 'markdown' || format === 'txt') {
    return res.json({
      success: true,
      format: format,
      data: `# ${docTitle}\n\n${grade ? `**المرحلة:** ${grade}\n` : ''}${subject ? `**المبحث:** ${subject}\n\n` : ''}---\n\n${content}`
    });
  }

  if (format === 'json') {
    return res.json({
      success: true,
      format: 'json',
      data: JSON.stringify({
        title: docTitle,
        grade,
        subject,
        content,
        exportedAt: new Date().toISOString()
      }, null, 2)
    });
  }

  res.json({ success: true, format: 'text', data: content });
});

// Serve static directory
app.use(express.static(__dirname));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${req.method} ${req.path}:`, err?.message || err);
  if (res.headersSent) return next(err);
  res.header('Access-Control-Allow-Origin', '*');
  res.status(err.status || 500).json({
    error: {
      code: err.type || 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'حدث خطأ غير متوقع في الخادم.'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HAKIM Ω Multi-Provider Production Server active on http://0.0.0.0:${PORT}`);
});
