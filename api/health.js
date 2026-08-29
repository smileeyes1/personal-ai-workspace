export default function handler(req, res) {
  const configured = Boolean(process.env.FOUNDRY_AGENT_ENDPOINT);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    service: 'HAKIM EDU Ω Institutional AI Runtime',
    mode: configured ? 'institutional-ready' : 'institutional-not-configured',
    institutionalAI: configured ? 'configured' : 'not-configured',
    provider: 'microsoft-foundry'
  });
}
