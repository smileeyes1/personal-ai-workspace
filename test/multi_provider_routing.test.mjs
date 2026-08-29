import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('HAKIM Ω — Multi-Provider Routing & Governance Test Suite', () => {
  it('GET /api/config returns complete multi-provider metadata and circuit breaker map', async () => {
    const res = await fetch('http://localhost:3000/api/config');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.providers));
    assert.ok(data.providers.some(p => p.id === 'gemini'));
    assert.ok(data.providers.some(p => p.id === 'groq'));
    assert.ok(data.providers.some(p => p.id === 'cloudflare'));
    assert.ok(data.providers.some(p => p.id === 'localDeterministic'));
    assert.ok(data.circuitBreaker);
  });

  it('POST /api/config/mode sets operating modes and rejects invalid mode', async () => {
    // 1. Valid mode
    const res = await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'ECONOMIC' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.mode, 'ECONOMIC');

    // 2. Switch to OFFLINE
    const resOffline = await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'OFFLINE' })
    });
    assert.equal(resOffline.status, 200);
    const dataOffline = await resOffline.json();
    assert.equal(dataOffline.mode, 'OFFLINE');

    // 3. Invalid mode
    const resInvalid = await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'NON_EXISTENT_MODE' })
    });
    assert.equal(resInvalid.status, 400);

    // Reset to AUTO
    await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'AUTO' })
    });
  });

  it('OFFLINE mode generates complete, high-quality CPA lesson with 0 external tokens', async () => {
    // Switch to OFFLINE
    await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'OFFLINE' })
    });

    const res = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'lesson',
        prompt: 'مفهوم الجمع بالضم للأعداد حتى 10',
        targetGrade: 'الصف الأول',
        targetSubject: 'الرياضيات'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.provider, 'local-deterministic');
    assert.equal(data.level, 0);
    assert.ok(data.text.includes('CPA'));
    assert.ok(data.text.includes('المحسوس'));
    assert.ok(data.text.includes('المصور'));
    assert.ok(data.text.includes('المجرد'));

    // Reset back to AUTO
    await fetch('http://localhost:3000/api/config/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'AUTO' })
    });
  });

  it('POST /api/providers/health checks live latency and health safely', async () => {
    const res = await fetch('http://localhost:3000/api/providers/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.results.localDeterministic);
    assert.equal(data.results.localDeterministic.connected, true);
  });
});
