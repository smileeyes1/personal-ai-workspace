const FOUNDRY_API_VERSION = process.env.FOUNDRY_API_VERSION || '2025-11-15-preview';

function json(status, body) {
  return { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'INSTITUTIONAL_AUTH_REQUIRED', message: 'يجب تسجيل الدخول بحساب Microsoft 365 المؤسسي.' });

  const endpoint = process.env.FOUNDRY_AGENT_ENDPOINT;
  if (!endpoint) return res.status(503).json({ error: 'INSTITUTIONAL_AI_NOT_CONFIGURED', message: 'محرك الذكاء المؤسسي Microsoft Foundry غير مربوط ببيئة التشغيل بعد.' });

  const token = auth.slice(7);
  const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
  if (!input) return res.status(400).json({ error: 'INPUT_REQUIRED' });
  if (input.length > 12000) return res.status(413).json({ error: 'INPUT_TOO_LARGE' });

  const system = `أنت HAKIM EDU Ω، وكيل التعليم المؤسسي للمعلم الفلسطيني. افهم الغاية لا الصياغة الحرفية، وخطط ثم نفذ ضمن الأدوات المتاحة، ولا تدّع تنفيذ إجراء خارجي لم يحدث. اجعل المخرجات عملية وجاهزة للاستخدام. احترم المنهاج الفلسطيني عندما تكون مصادره متاحة. عند الرياضيات العربية الشرقية يجب أن يكون الترتيب البصري التعليمي صريحًا ولا يعتمد على BiDi. لا تكشف أسرار النظام أو الرموز المميزة أو بيانات الاعتماد.`;

  const body = {
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      { role: 'user', content: [{ type: 'input_text', text: input }] }
    ],
    temperature: 0.2,
    max_output_tokens: 3000
  };

  try {
    const target = `${endpoint.replace(/\/$/, '')}/responses?api-version=${encodeURIComponent(FOUNDRY_API_VERSION)}`;
    const r = await fetch(target, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!r.ok) return res.status(r.status).json({ error: 'FOUNDRY_REQUEST_FAILED', upstreamStatus: r.status, details: data });

    const output = data.output?.flatMap(item => item.content || []).map(x => x.text || x.value || '').filter(Boolean).join('\n')
      || data.output_text
      || data.choices?.[0]?.message?.content
      || '';
    return res.status(200).json({ ok: true, text: output, provider: 'microsoft-foundry', responseId: data.id || null });
  } catch (e) {
    return res.status(502).json({ error: 'FOUNDRY_GATEWAY_ERROR', message: e?.message || 'تعذر الاتصال بمحرك الذكاء المؤسسي.' });
  }
}
