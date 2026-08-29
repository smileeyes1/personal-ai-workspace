/* HAKIM EDU Ω — Institutional Identity Gate
 * Production identity: Microsoft Entra ID / Microsoft 365 work-school accounts.
 * The application fails closed for protected institutional use until authentication succeeds.
 * No client secret is stored in the browser.
 */
(function () {
  'use strict';

  const CONFIG_KEY = 'hakim_enterprise_config_v2';
  const SESSION_KEY = 'hakim_enterprise_session_v2';
  const GEMINI_KEY = 'hakim_gemini_api_key_v2';
  const GRAPH_SCOPE = 'https://graph.microsoft.com/User.Read';
  const MSAL_URL = 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@5.4.0/lib/msal-browser.min.js';
  const REQUIRE_INSTITUTIONAL_AUTH = true;

  const defaults = {
    clientId: '',
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: window.location.origin + window.location.pathname,
    allowedTenantIds: []
  };

  const loadConfig = () => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') };
    } catch {
      return { ...defaults };
    }
  };

  const saveConfig = (v) => localStorage.setItem(CONFIG_KEY, JSON.stringify(v));
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' }[c]));

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.msal) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function addStyles() {
    if (document.getElementById('hakim-enterprise-styles')) return;
    const style = document.createElement('style');
    style.id = 'hakim-enterprise-styles';
    style.textContent = `
      #hakim-auth-gate{position:fixed;inset:0;z-index:100000;background:#f8fafc;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;font-family:system-ui,-apple-system,sans-serif}
      #hakim-auth-gate .ag-card{width:min(560px,96vw);background:#fff;border:1px solid #dbe4ea;border-radius:22px;padding:30px;box-shadow:0 24px 70px rgba(15,23,42,.16);text-align:center}
      #hakim-auth-gate .ag-logo{width:64px;height:64px;margin:0 auto 14px;border-radius:16px;background:linear-gradient(135deg,#0f766e,#14b8a6);color:#fff;display:grid;place-items:center;font-size:34px;font-weight:900}
      #hakim-auth-gate h1{font-size:24px;margin:0 0 8px;color:#0f172a}
      #hakim-auth-gate p{font-size:14px;line-height:1.8;color:#475569;margin:0 0 18px}
      #hakim-auth-gate button{border:0;border-radius:11px;padding:12px 18px;font-weight:800;cursor:pointer;font-size:14px}
      #hakim-auth-gate .primary{background:#0f766e;color:#fff}.secondary{background:#f1f5f9;color:#0f172a}
      #hakim-auth-gate .muted{font-size:12px;color:#64748b;margin-top:14px}
      #hakim-auth-gate .setup{text-align:right;margin-top:18px;padding-top:18px;border-top:1px solid #e2e8f0;display:none}
      #hakim-auth-gate input{width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:9px;margin:6px 0 10px;font:inherit;direction:ltr}
      #hakim-auth-gate label{font-size:12px;font-weight:700;color:#334155;display:block;text-align:right}
      #hakim-enterprise-bar{position:fixed;top:10px;left:10px;z-index:99999;font-family:system-ui,sans-serif;direction:rtl}
      #hakim-enterprise-bar .hb{background:#fff;border:1px solid #dbe4ea;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,.16);padding:8px 10px;display:flex;gap:7px;align-items:center}
      #hakim-enterprise-bar button{border:0;border-radius:9px;padding:8px 12px;font-weight:700;cursor:pointer}
      #hakim-enterprise-bar .primary{background:#0f766e;color:#fff}.secondary{background:#f1f5f9;color:#0f172a}
      #hakim-enterprise-status{font-size:12px;color:#475569;max-width:220px}
    `;
    document.head.appendChild(style);
  }

  function ensureGate() {
    if (!REQUIRE_INSTITUTIONAL_AUTH || document.getElementById('hakim-auth-gate')) return;
    addStyles();
    const gate = document.createElement('div');
    gate.id = 'hakim-auth-gate';
    gate.innerHTML = `
      <div class="ag-card">
        <div class="ag-logo">Ω</div>
        <h1>HAKIM EDU Ω</h1>
        <p>منظومة التعليم المؤسسية. الدخول للبيئة الإنتاجية مخصص لحسابات Microsoft 365 المؤسسية المصرح بها.</p>
        <button id="hakim-gate-login" class="primary">الدخول بحساب Microsoft 365</button>
        <div id="hakim-gate-message" class="muted">سيتم التحقق من هوية المؤسسة والصلاحيات قبل فتح المنظومة.</div>
        <div id="hakim-gate-setup" class="setup">
          <label>Microsoft Entra Client ID</label>
          <input id="hakim-gate-client-id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
          <label>معرّفات المؤسسات المسموح بها (اختياري)</label>
          <input id="hakim-gate-tenants" placeholder="tenant-id,tenant-id">
          <button id="hakim-gate-save" class="secondary">حفظ إعداد المؤسسة</button>
        </div>
      </div>`;
    document.body.appendChild(gate);
    const cfg = loadConfig();
    document.getElementById('hakim-gate-client-id').value = cfg.clientId || '';
    document.getElementById('hakim-gate-tenants').value = (cfg.allowedTenantIds || []).join(',');
    document.getElementById('hakim-gate-login').onclick = login;
    document.getElementById('hakim-gate-save').onclick = () => {
      saveConfig({ ...loadConfig(), clientId: document.getElementById('hakim-gate-client-id').value.trim(), allowedTenantIds: document.getElementById('hakim-gate-tenants').value.split(',').map(x => x.trim()).filter(Boolean) });
      setGateMessage('تم حفظ إعدادات الهوية على هذا الجهاز. يمكن الآن بدء تسجيل الدخول.');
    };
  }

  function setGateMessage(message) {
    const el = document.getElementById('hakim-gate-message');
    if (el) el.textContent = message;
  }

  function openSetup() {
    const el = document.getElementById('hakim-gate-setup');
    if (el) el.style.display = 'block';
  }

  let msalApp = null;
  async function getMsal() {
    const cfg = loadConfig();
    if (!cfg.clientId) {
      setGateMessage('البيئة المؤسسية تحتاج Client ID لتطبيق HAKIM في Microsoft Entra.');
      openSetup();
      throw new Error('Microsoft Entra Client ID is not configured.');
    }
    await loadScript(MSAL_URL);
    if (!msalApp) {
      msalApp = new msal.PublicClientApplication({
        auth: { clientId: cfg.clientId, authority: cfg.authority, redirectUri: cfg.redirectUri },
        cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false }
      });
    }
    await msalApp.initialize();
    return msalApp;
  }

  async function login() {
    try {
      setGateMessage('جاري فتح Microsoft 365 والتحقق من الحساب...');
      const app = await getMsal();
      const result = await app.loginPopup({ scopes: [GRAPH_SCOPE], prompt: 'select_account' });
      const account = result.account;
      const claims = account?.idTokenClaims || {};
      const cfg = loadConfig();
      if (!claims.tid) throw new Error('لم يتم العثور على Tenant ID في هوية الحساب.');
      if (cfg.allowedTenantIds.length && !cfg.allowedTenantIds.includes(claims.tid)) throw new Error('هذا الحساب ليس ضمن المؤسسة المصرح بها.');
      app.setActiveAccount(account);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ name: account.name, email: account.username, tenantId: claims.tid, homeAccountId: account.homeAccountId, loggedAt: new Date().toISOString() }));
      updateStatus(account);
      const gate = document.getElementById('hakim-auth-gate');
      if (gate) gate.remove();
      document.dispatchEvent(new CustomEvent('hakim:authenticated', { detail: { account, tenantId: claims.tid } }));
    } catch (e) {
      setGateMessage('تعذر تسجيل الدخول: ' + (e.message || e));
      openSetup();
    }
  }

  async function logout() {
    try {
      const app = await getMsal();
      await app.logoutPopup({ account: app.getActiveAccount() || app.getAllAccounts()[0] });
    } catch {}
    localStorage.removeItem(SESSION_KEY);
    updateStatus(null);
    if (REQUIRE_INSTITUTIONAL_AUTH) ensureGate();
  }

  function ui() {
    if (document.getElementById('hakim-enterprise-bar')) return;
    addStyles();
    const root = document.createElement('div');
    root.id = 'hakim-enterprise-bar';
    root.innerHTML = `<div class="hb"><span id="hakim-enterprise-status">لم يتم تسجيل الدخول</span><button id="hakim-enterprise-logout" class="secondary" style="display:none">تسجيل الخروج</button></div>`;
    document.body.appendChild(root);
    document.getElementById('hakim-enterprise-logout').onclick = logout;
  }

  function updateStatus(account) {
    const el = document.getElementById('hakim-enterprise-status');
    const btn = document.getElementById('hakim-enterprise-logout');
    if (!el || !btn) return;
    if (account) { el.textContent = '✓ ' + (account.name || account.username); btn.style.display = 'inline-block'; }
    else { el.textContent = 'لم يتم تسجيل الدخول'; btn.style.display = 'none'; }
  }

  async function authHeader() {
    try {
      const app = await getMsal();
      const a = app.getActiveAccount() || app.getAllAccounts()[0];
      if (!a) return null;
      app.setActiveAccount(a);
      const r = await app.acquireTokenSilent({ account: a, scopes: [GRAPH_SCOPE] });
      return r.accessToken;
    } catch { return null; }
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isLocalApi = /^\/?api\//.test(url) || url.includes('/api/');
    if (isLocalApi) {
      init = { ...init, headers: new Headers(init.headers || {}) };
      const token = await authHeader();
      if (token) init.headers.set('Authorization', 'Bearer ' + token);
      const key = localStorage.getItem(GEMINI_KEY);
      if (key) init.headers.set('x-gemini-key', key);
    }
    return nativeFetch(input, init);
  };

  window.HAKIM_ENTERPRISE = {
    requireAuth: REQUIRE_INSTITUTIONAL_AUTH,
    getConfig: loadConfig,
    getGeminiKey: () => localStorage.getItem(GEMINI_KEY) || '',
    getSession: () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } },
    getMicrosoftAccessToken: authHeader,
    logout
  };

  function boot() {
    ui();
    const s = window.HAKIM_ENTERPRISE.getSession();
    if (s) {
      updateStatus({ name: s.name, username: s.email });
    } else {
      ensureGate();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
