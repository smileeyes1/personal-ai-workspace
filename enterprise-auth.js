/* HAKIM Ω Enterprise Identity Layer
 * Microsoft Entra ID / Microsoft 365 work-school authentication using MSAL Browser.
 * No client secret is stored in the browser. API keys are stored locally only when the user explicitly chooses to do so.
 */
(function () {
  'use strict';

  const CONFIG_KEY = 'hakim_enterprise_config_v1';
  const SESSION_KEY = 'hakim_enterprise_session_v1';
  const GEMINI_KEY = 'hakim_gemini_api_key_v1';
  const GRAPH_SCOPE = 'https://graph.microsoft.com/User.Read';
  const MSAL_URL = 'https://cdn.jsdelivr.net/npm/@azure/msal-browser@5.4.0/lib/msal-browser.min.js';

  const defaults = {
    clientId: '',
    authority: 'https://login.microsoftonline.com/organizations',
    redirectUri: window.location.origin + window.location.pathname,
    allowedTenantIds: []
  };

  const loadConfig = () => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') }; }
    catch { return { ...defaults }; }
  };
  const saveConfig = (v) => localStorage.setItem(CONFIG_KEY, JSON.stringify(v));
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' }[c]));

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.msal) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ui() {
    if (document.getElementById('hakim-enterprise-bar')) return;
    const style = document.createElement('style');
    style.textContent = `
      #hakim-enterprise-bar{position:fixed;top:10px;left:10px;z-index:99999;font-family:system-ui,sans-serif;direction:rtl}
      #hakim-enterprise-bar .hb{background:#fff;border:1px solid #dbe4ea;border-radius:14px;box-shadow:0 8px 30px rgba(15,23,42,.16);padding:8px 10px;display:flex;gap:7px;align-items:center}
      #hakim-enterprise-bar button{border:0;border-radius:9px;padding:8px 12px;font-weight:700;cursor:pointer}
      #hakim-enterprise-bar .primary{background:#0f766e;color:#fff}.secondary{background:#f1f5f9;color:#0f172a}
      #hakim-enterprise-status{font-size:12px;color:#475569;max-width:220px}
      #hakim-enterprise-panel{display:none;position:fixed;inset:0;background:rgba(2,6,23,.45);z-index:100000;align-items:center;justify-content:center}
      #hakim-enterprise-panel .card{width:min(620px,94vw);max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:22px;direction:rtl;box-shadow:0 20px 60px rgba(0,0,0,.25)}
      #hakim-enterprise-panel input{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:9px;margin:6px 0 12px;font-family:inherit}
      #hakim-enterprise-panel label{font-size:13px;font-weight:700;color:#334155}.row{display:flex;gap:8px;flex-wrap:wrap}.row button{margin-top:4px}
      #hakim-enterprise-msg{font-size:13px;color:#475569;margin:10px 0;line-height:1.6}
    `;
    document.head.appendChild(style);
    const root = document.createElement('div'); root.id='hakim-enterprise-bar';
    root.innerHTML = `<div class="hb"><span id="hakim-enterprise-status">لم يتم تسجيل الدخول</span><button id="hakim-login" class="primary">دخول Microsoft 365</button><button id="hakim-settings" class="secondary">الإعدادات</button></div>`;
    document.body.appendChild(root);
    const panel=document.createElement('div'); panel.id='hakim-enterprise-panel';
    panel.innerHTML=`<div class="card"><h2>هوية المؤسسة والذكاء الاصطناعي</h2><p id="hakim-enterprise-msg">إعداد دخول Microsoft 365 وإضافة مفتاح Google Gemini عند الحاجة.</p>
      <label>Microsoft Entra Application (Client ID)</label><input id="hakim-client-id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
      <label>Tenant / Authority</label><input id="hakim-authority" value="https://login.microsoftonline.com/organizations">
      <label>Allowed Tenant IDs (اختياري، مفصولة بفواصل)</label><input id="hakim-tenants" placeholder="معرّفات مؤسسات الوزارة/المديريات المسموح بها">
      <label>Google Gemini API Key (اختياري)</label><input id="hakim-gemini-key" type="password" placeholder="AIza...">
      <div class="row"><button id="hakim-save" class="primary">حفظ الإعدادات</button><button id="hakim-close" class="secondary">إغلاق</button><button id="hakim-logout" class="secondary">تسجيل الخروج</button></div></div>`;
    document.body.appendChild(panel);

    const cfg=loadConfig();
    document.getElementById('hakim-client-id').value=cfg.clientId||'';
    document.getElementById('hakim-authority').value=cfg.authority||defaults.authority;
    document.getElementById('hakim-tenants').value=(cfg.allowedTenantIds||[]).join(',');
    document.getElementById('hakim-gemini-key').value=localStorage.getItem(GEMINI_KEY)||'';
    document.getElementById('hakim-settings').onclick=()=>panel.style.display='flex';
    document.getElementById('hakim-close').onclick=()=>panel.style.display='none';
    document.getElementById('hakim-save').onclick=()=>{
      saveConfig({clientId:document.getElementById('hakim-client-id').value.trim(),authority:document.getElementById('hakim-authority').value.trim()||defaults.authority,redirectUri:defaults.redirectUri,allowedTenantIds:document.getElementById('hakim-tenants').value.split(',').map(x=>x.trim()).filter(Boolean)});
      const key=document.getElementById('hakim-gemini-key').value.trim(); if(key)localStorage.setItem(GEMINI_KEY,key); else localStorage.removeItem(GEMINI_KEY);
      document.getElementById('hakim-enterprise-msg').textContent='تم حفظ الإعدادات محليًا على هذا الجهاز.';
    };
    document.getElementById('hakim-login').onclick=login;
    document.getElementById('hakim-logout').onclick=logout;
  }

  let msalApp=null;
  async function getMsal(){
    const cfg=loadConfig();
    if(!cfg.clientId){ ui(); document.getElementById('hakim-enterprise-panel').style.display='flex'; throw new Error('يجب إدخال Client ID الخاص بتطبيق Microsoft Entra.'); }
    await loadScript(MSAL_URL);
    if(!msalApp) msalApp=new msal.PublicClientApplication({auth:{clientId:cfg.clientId,authority:cfg.authority,redirectUri:cfg.redirectUri},cache:{cacheLocation:'sessionStorage',storeAuthStateInCookie:false}});
    await msalApp.initialize();
    return msalApp;
  }

  async function login(){
    try{
      const app=await getMsal();
      const result=await app.loginPopup({scopes:[GRAPH_SCOPE],prompt:'select_account'});
      const account=result.account;
      const claims=account?.idTokenClaims||{};
      const cfg=loadConfig();
      if(cfg.allowedTenantIds.length && !cfg.allowedTenantIds.includes(claims.tid)) throw new Error('هذا الحساب ليس ضمن المؤسسات المسموح بها.');
      localStorage.setItem(SESSION_KEY,JSON.stringify({name:account.name,email:account.username,tenantId:claims.tid,homeAccountId:account.homeAccountId,loggedAt:new Date().toISOString()}));
      updateStatus(account);
    }catch(e){document.getElementById('hakim-enterprise-msg').textContent='فشل تسجيل الدخول: '+(e.message||e);document.getElementById('hakim-enterprise-panel').style.display='flex';}
  }

  async function logout(){try{const app=await getMsal();await app.logoutPopup({account:app.getActiveAccount()||app.getAllAccounts()[0]});}catch{} localStorage.removeItem(SESSION_KEY);updateStatus(null);}

  function updateStatus(account){
    const el=document.getElementById('hakim-enterprise-status'); const btn=document.getElementById('hakim-login');
    if(account){el.textContent='مرحبًا '+(account.name||account.username);btn.textContent='Microsoft 365 ✓';}
    else{el.textContent='لم يتم تسجيل الدخول';btn.textContent='دخول Microsoft 365';}
  }

  async function authHeader(){
    try{const app=await getMsal();const a=app.getActiveAccount()||app.getAllAccounts()[0];if(!a)return null;app.setActiveAccount(a);const r=await app.acquireTokenSilent({account:a,scopes:[GRAPH_SCOPE]});return r.accessToken;}catch{return null;}
  }

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const isLocalApi=/^\/?api\//.test(url)||url.includes('/api/');
    if(isLocalApi){
      init={...init,headers:new Headers(init.headers||{})};
      const token=await authHeader(); if(token) init.headers.set('Authorization','Bearer '+token);
      const key=localStorage.getItem(GEMINI_KEY); if(key) init.headers.set('x-gemini-key',key);
    }
    return nativeFetch(input,init);
  };

  window.HAKIM_ENTERPRISE={
    getConfig:loadConfig,
    getGeminiKey:()=>localStorage.getItem(GEMINI_KEY)||'',
    getSession:()=>{try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}},
    getMicrosoftAccessToken:authHeader
  };

  function boot(){ui();const s=window.HAKIM_ENTERPRISE.getSession();if(s)updateStatus({name:s.name,username:s.email});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
