import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Deterministic HAKIM Ω Pedagogical Validator Engine
function auditPedagogicalContent({ content, grade = 'الصف الأول', subject = 'الرياضيات' }) {
  const issues = [];
  const score = { total: 100 };

  // 1. Double/Multiple Goals Check
  const objectiveMatches = content.match(/ناتج التعلم|الهدف الرئيس|الهدف التعليمي|يهدف الدرس إلى/g) || [];
  const bulletObjectives = content.match(/(?:-|\*|\d+\.)\s*أن (?:يعد|يكتب|يجمع|يطرح|يميز|يقرأ|يحلل)/g) || [];
  if (bulletObjectives.length > 2) {
    issues.push({
      dimension: 'التوازن المعرفي ووحدة الهدف',
      type: 'MULTIPLE_GOALS_DETECTED',
      message: 'تم رصد أكثر من ناتج تعلم رئيسي في درس واحد مما يشتت ذهن التلميذ في الصفوف الأساسية.'
    });
    score.total -= 20;
  }

  // 2. Mathematical Inaccuracy Check (Regex basic evaluation)
  const mathMatches = [...content.matchAll(/(\d+)\s*([\+\-\*\/×÷])\s*(\d+)\s*=\s*(\d+)/g)];
  for (const m of mathMatches) {
    const op1 = parseInt(m[1], 10);
    const op = m[2];
    const op2 = parseInt(m[3], 10);
    const statedRes = parseInt(m[4], 10);

    let actualRes;
    if (op === '+' || op === '＋') actualRes = op1 + op2;
    else if (op === '-' || op === '−') actualRes = op1 - op2;
    else if (op === '*' || op === '×') actualRes = op1 * op2;
    else if (op === '/' || op === '÷') actualRes = Math.floor(op1 / op2);

    if (actualRes !== undefined && actualRes !== statedRes) {
      issues.push({
        dimension: 'السلامة العلمية والرياضية',
        type: 'MATH_CALCULATION_ERROR',
        message: `خطأ حسابي صريح: التعبير (${m[0]}) غير صحيح، الناتج الفعلي هو (${actualRes}).`
      });
      score.total -= 35;
    }
  }

  // 3. Counting & Visual Group Match Check
  const visualGroupMatches = [...content.matchAll(/(\d+)\s*(?:تفاحات|أقلام|مكعبات|نجوم|عناصر|بالونات)?\s*[:：]\s*([🍎✏️⭐🎈🔴🟢🟦🟧]+)/gu)];
  for (const vm of visualGroupMatches) {
    const targetCount = parseInt(vm[1], 10);
    // Count unicode emojis
    const items = [...vm[2]];
    if (items.length !== targetCount) {
      issues.push({
        dimension: 'مطابقة التمثيل المصور للأعداد',
        type: 'COUNTING_MISMATCH',
        message: `عدم تطابق بصري: العدد المذكور (${targetCount}) ولكن عدد الرموز الرسومية الفعلي هو (${items.length}).`
      });
      score.total -= 25;
    }
  }

  // 4. Developmental Stage Suitability Check (Grade 1 vs advanced topics)
  if (grade.includes('الأول') && /القسمة المطولة|الكسور العشرية|المعادلات الجبرية|جدول الضرب 9|اللوغاريتمات/i.test(content)) {
    issues.push({
      dimension: 'الملاءمة النمائية',
      type: 'DEVELOPMENTAL_OVERLOAD',
      message: `الموضوع يتجاوز الخصائص النمائية لتلاميذ (${grade}).`
    });
    score.total -= 30;
  }

  // 5. CPA Progression Check
  const hasConcrete = /المحسوس|أدوات محسوسة|مكعبات|أزرار|أقلام ملموسة|حسية|ملموس/i.test(content);
  const hasPictorial = /المصور|شبه المحسوس|رسم|صور|بطاقات نقطية|مصفوفة/i.test(content);
  const hasAbstract = /الرمزي|المجرد|الأعداد|الرموز|جملة الجمع|جملة الطرح/i.test(content);

  if (subject === 'الرياضيات' && (!hasConcrete || !hasPictorial || !hasAbstract)) {
    issues.push({
      dimension: 'مسار التدرج النمائي CPA',
      type: 'INCOMPLETE_CPA_PROGRESSION',
      message: 'الدرس يفتقر إلى الاكتمال في مراحل التدرج النمائي (محسوس ← مصور ← مجرد).'
    });
    score.total -= 20;
  }

  // 6. Mastery Criteria & Assessment Rubric Check
  const hasMasteryCriteria = /معيار الإتقان|سلم التقدير|مفتاح الإجابة|نسبة الإتقان|محك النجاح/i.test(content);
  if (!hasMasteryCriteria) {
    issues.push({
      dimension: 'معايير الإتقان والتقويم',
      type: 'MISSING_MASTERY_CRITERIA',
      message: 'الخطة تفتقر إلى تحديد معيار إتقان صريح ومحدد للتحقق من تمكن الطلبة.'
    });
    score.total -= 15;
  }

  score.total = Math.max(0, score.total);
  const hasFatalFlaw = issues.some(i => ['MATH_CALCULATION_ERROR', 'COUNTING_MISMATCH', 'DEVELOPMENTAL_OVERLOAD'].includes(i.type)) || score.total < 70;
  const status = !hasFatalFlaw && score.total >= 85 ? 'PASS' : (!hasFatalFlaw && score.total >= 70) ? 'PASS_WITH_WARNINGS' : 'FAIL';

  return { status, score: score.total, issues };
}

describe('HAKIM Ω — Deterministic Pedagogical Auditor Rules Suite', () => {
  it('PASSES fully compliant CPA lesson plan with strict criteria', () => {
    const validLesson = `### خطة درس: مفهوم الجمع بالضم
المبحث: الرياضيات | الصف: الصف الأول
ناتج التعلم: أن يجد التلميذ ناتج جمع عددين ضمن 10 باستخدام المحسوسات.

1. مسار التدرج النمائي:
- المحسوس: استخدام 4 مكعبات حمراء و 3 مكعبات زرقاء وضمها على الطاولة.
- المصور: رسم مجموعتين: 4 تفاحات : 🍎🍎🍎🍎 + 3 تفاحات : 🍎🍎🍎
- الرمزي: 4 + 3 = 7

2. معيار الإتقان:
أن يحل التلميذ 4 مسائل من أصل 5 بصورة صحيحة بدون مساعدة.`;

    const result = auditPedagogicalContent({ content: validLesson, grade: 'الصف الأول', subject: 'الرياضيات' });
    assert.equal(result.status, 'PASS');
    assert.equal(result.issues.length, 0);
  });

  it('FAILS when an explicit mathematical calculation error is introduced (5 + 3 = 10)', () => {
    const badMathLesson = `### خطة درس: الجمع
المبحث: الرياضيات | الصف: الصف الأول
المحسوس: مكعبات
المصور: رسم
الرمزي: 5 + 3 = 10
معيار الإتقان: 80%`;

    const result = auditPedagogicalContent({ content: badMathLesson, grade: 'الصف الأول', subject: 'الرياضيات' });
    assert.equal(result.status, 'FAIL');
    assert.ok(result.issues.some(i => i.type === 'MATH_CALCULATION_ERROR'));
  });

  it('FAILS when visual group count does not match the stated value (stated 4 apples, drew 5)', () => {
    const mismatchLesson = `### تدريب مصور
المبحث: الرياضيات | الصف: الصف الأول
المحسوس: أزرار
المصور: 4 تفاحات : 🍎🍎🍎🍎🍎
الرمزي: 4 + 1 = 5
معيار الإتقان: 80%`;

    const result = auditPedagogicalContent({ content: mismatchLesson, grade: 'الصف الأول', subject: 'الرياضيات' });
    assert.ok(result.issues.some(i => i.type === 'COUNTING_MISMATCH'));
  });

  it('FAILS when content exceeds the developmental stage of Grade 1 students', () => {
    const overloadLesson = `### درس متقدم
المبحث: الرياضيات | الصف: الصف الأول
الموضوع: القسمة المطولة والكسور العشرية
المحسوس: ملموس
المصور: رسم
الرمزي: 10 / 2 = 5
معيار الإتقان: 80%`;

    const result = auditPedagogicalContent({ content: overloadLesson, grade: 'الصف الأول', subject: 'الرياضيات' });
    assert.ok(result.issues.some(i => i.type === 'DEVELOPMENTAL_OVERLOAD'));
  });

  it('FAILS or WARNS when CPA progression is missing or mastery criteria is absent', () => {
    const incompleteLesson = `### خطة مجردة فقط
المبحث: الرياضيات | الصف: الصف الأول
المعادلة: 2 + 2 = 4`;

    const result = auditPedagogicalContent({ content: incompleteLesson, grade: 'الصف الأول', subject: 'الرياضيات' });
    assert.equal(result.status, 'FAIL');
    assert.ok(result.issues.some(i => i.type === 'INCOMPLETE_CPA_PROGRESSION'));
    assert.ok(result.issues.some(i => i.type === 'MISSING_MASTERY_CRITERIA'));
  });
});
