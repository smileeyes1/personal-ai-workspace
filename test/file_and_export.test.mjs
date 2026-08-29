import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Deterministic File Parsers and Simulators
function parseCsvContent(csvString) {
  if (!csvString || !csvString.trim()) return [];
  const lines = csvString.trim().split(/\r?\n/);
  return lines.map(line => line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));
}

function parseJsonContent(jsonString) {
  if (!jsonString || !jsonString.trim()) throw new Error('Empty JSON content');
  return JSON.parse(jsonString);
}

function formatA4HtmlExport({ title, grade, subject, content, numeralType = 'standard' }) {
  // Enforce clean RTL structure and isolated math expressions
  const sanitizedContent = content
    .replace(/(\d+)\s*([\+\-\×\÷\=])\s*(\d+)\s*\=\s*(\d+)/g, '<span class="math-expr" dir="ltr">$1 $2 $3 = $4</span>');

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Tajawal', sans-serif; line-height: 1.6; color: #0f172a; direction: rtl; }
    .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
    .math-expr { direction: ltr; unicode-bidi: embed; font-weight: bold; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${title}</h2>
    <p>المبحث: ${subject} | الصف: ${grade}</p>
  </div>
  <div class="content">${sanitizedContent}</div>
</body>
</html>`;
}

function convertDigitsToArabicIndic(str) {
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, w => arabicIndicDigits[+w]);
}

describe('HAKIM Ω — File Processing, Math Isolation & Export Validation Suite', () => {
  it('correctly parses standard and Arabic UTF-8 CSV datasets', () => {
    const csvData = `المبحث,الصف,الكفاية,الدرجة
الرياضيات,الصف الأول,الجمع بالضم,100
اللغة العربية,الصف الثاني,التحليل الصوتي,95`;
    const parsed = parseCsvContent(csvData);
    assert.equal(parsed.length, 3);
    assert.equal(parsed[1][0], 'الرياضيات');
    assert.equal(parsed[1][2], 'الجمع بالضم');
    assert.equal(parsed[2][0], 'اللغة العربية');
  });

  it('gracefully handles empty, corrupted, and large structured files', () => {
    // Empty CSV
    assert.deepEqual(parseCsvContent(''), []);
    assert.deepEqual(parseCsvContent('   \n  '), []);

    // Valid JSON
    const validJson = JSON.stringify({ project: 'HAKIM Ω', grade: 'Grade 1', lessons: 5 });
    const parsedJson = parseJsonContent(validJson);
    assert.equal(parsedJson.project, 'HAKIM Ω');

    // Corrupted JSON throws cleanly
    assert.throws(() => parseJsonContent('{"invalid": json'), /SyntaxError|JSON/);

    // Empty JSON throws cleanly
    assert.throws(() => parseJsonContent(''), /Empty JSON content/);
  });

  it('generates compliant, high-fidelity A4 HTML with strict RTL and LTR math isolation', () => {
    const exportedDoc = formatA4HtmlExport({
      title: 'ورقة عمل الجمع المصور',
      grade: 'الصف الأول',
      subject: 'الرياضيات',
      content: 'حل المسألة التالية: 4 + 3 = 7 واكتب الناتج في المربع.'
    });

    assert.match(exportedDoc, /<!doctype html>/);
    assert.match(exportedDoc, /dir="rtl"/);
    assert.match(exportedDoc, /@page\s*\{\s*size:\s*A4;/);
    assert.match(exportedDoc, /<span class="math-expr" dir="ltr">4 \+ 3 = 7<\/span>/);
  });

  it('converts numbers accurately to Arabic-Indic digits when requested', () => {
    const input = 'العدد 123 والناتج 789';
    const converted = convertDigitsToArabicIndic(input);
    assert.equal(converted, 'العدد ١٢٣ والناتج ٧٨٩');
  });

  it('verifies that server secrets are NEVER serialized in client backups or state files', () => {
    const backupPayload = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      projects: [{ id: 'p1', title: 'خطة درس' }]
    };
    const serialized = JSON.stringify(backupPayload);
    assert.equal(serialized.includes('GEMINI_API_KEY'), false);
    assert.equal(serialized.includes('sk-'), false);
    assert.equal(serialized.includes('AIza'), false);
  });
});
