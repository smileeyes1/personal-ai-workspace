import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3000';

describe('HAKIM Ω — Core API Gateway & Endpoints Integration Suite', () => {
  it('GET /api/health returns healthy state, uptime, and secure telemetry without exposing secrets', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.hasKey, true);
    assert.equal(typeof data.uptimeSeconds, 'number');
    assert.ok(data.telemetry);
    assert.equal(typeof data.telemetry.total, 'number');
    // Verify no secret leak
    const rawText = JSON.stringify(data);
    assert.equal(rawText.includes(process.env.GEMINI_API_KEY || 'AIzaSy'), false);
  });

  it('GET /api/config returns model pool, circuit breaker states, and task token budgets', async () => {
    const res = await fetch(`${BASE_URL}/api/config`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.primaryModel, 'gemini-3.7-flash');
    assert.equal(data.fallbackModel, 'gemini-3.1-flash-lite');
    assert.equal(data.proModel, 'gemini-3.1-pro-preview');
    assert.ok(data.circuitBreaker);
    assert.ok(data.taskBudgets);
    assert.equal(data.taskBudgets.lesson.preferredModel, 'gemini-3.7-flash');
    assert.equal(data.taskBudgets.quick_chat.preferredModel, 'gemini-3.1-flash-lite');
  });

  it('GET /api/competencies filters accurately by grade, subject, and search query', async () => {
    // 1. Grade filter
    const resGrade = await fetch(`${BASE_URL}/api/competencies?grade=${encodeURIComponent('الصف الأول')}`);
    assert.equal(resGrade.status, 200);
    const dataGrade = await resGrade.json();
    assert.ok(dataGrade.competencies.length > 0);
    assert.ok(dataGrade.competencies.every(c => c.grade.includes('الأول')));

    // 2. Subject filter
    const resSubject = await fetch(`${BASE_URL}/api/competencies?subject=${encodeURIComponent('الرياضيات')}`);
    const dataSubject = await resSubject.json();
    assert.ok(dataSubject.competencies.every(c => c.subject === 'الرياضيات'));

    // 3. Search query filter
    const resQuery = await fetch(`${BASE_URL}/api/competencies?q=${encodeURIComponent('الجمع')}`);
    const dataQuery = await resQuery.json();
    assert.ok(dataQuery.competencies.length > 0);
    assert.ok(dataQuery.competencies.some(c => c.skill.includes('الجمع')));
  });

  it('POST /api/competencies adds structured custom competencies with progression', async () => {
    const customComp = {
      subject: 'الرياضيات',
      grade: 'الصف الثاني',
      domain: 'القياس والهندسة',
      skill: 'قياس الأطوال بوحدات غير معيارية ومعيارية (سم)',
      learning_objective: 'أن يقيس التلميذ طول أشياء من بيئته باستخدام المسطرة بالسنتيمتر بدقة.',
      success_criteria: ['يحدد نقطة الصفر على المسطرة', 'يقيس طول القلم بالسنتيمتر']
    };

    const res = await fetch(`${BASE_URL}/api/competencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customComp)
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.competency.id.startsWith('C_CUSTOM_'));
    assert.equal(data.competency.skill, customComp.skill);
  });

  it('CRUD /api/projects operates smoothly and securely', async () => {
    // 1. Create Project
    const newProj = {
      title: 'خطة درس اختبارية: قياس الأطوال',
      type: 'lesson',
      subject: 'الرياضيات',
      grade: 'الصف الثاني',
      competencyId: 'M2-MEASURE',
      content: 'خطة درس نموذجية للقياس...',
      tags: ['رياضيات', 'قياس']
    };

    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProj)
    });
    assert.equal(createRes.status, 200);
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    const projId = createData.project.id;

    // 2. Read Projects
    const listRes = await fetch(`${BASE_URL}/api/projects`);
    const listData = await listRes.json();
    assert.ok(listData.projects.some(p => p.id === projId));

    // 3. Update Project
    const updateRes = await fetch(`${BASE_URL}/api/projects/${projId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'خطة درس محدثة: قياس الأطوال بالسنتيمتر' })
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.project.title, 'خطة درس محدثة: قياس الأطوال بالسنتيمتر');

    // 4. Delete Project
    const deleteRes = await fetch(`${BASE_URL}/api/projects/${projId}`, {
      method: 'DELETE'
    });
    assert.equal(deleteRes.status, 200);

    // 5. Confirm Deletion
    const afterListRes = await fetch(`${BASE_URL}/api/projects`);
    const afterListData = await afterListRes.json();
    assert.equal(afterListData.projects.some(p => p.id === projId), false);
  });

  it('Rejects invalid or empty AI requests with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });
});
