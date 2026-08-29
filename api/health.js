export default function handler(req, res) {
  res.status(200).json({ ok: true, service: 'HAKIM EDU Ω AI Runtime', mode: 'runtime-ready' });
}
