/* Microsoft Graph Education client foundation.
 * Requires HAKIM_ENTERPRISE.getMicrosoftAccessToken() from enterprise-auth.js.
 * Uses Microsoft Graph v1.0 production endpoints only.
 */
(function () {
  'use strict';
  const GRAPH = 'https://graph.microsoft.com/v1.0';

  async function request(path, options = {}) {
    if (!window.HAKIM_ENTERPRISE) throw new Error('Enterprise identity layer is not loaded.');
    const token = await window.HAKIM_ENTERPRISE.getMicrosoftAccessToken();
    if (!token) throw new Error('يجب تسجيل الدخول بحساب Microsoft 365 المؤسسي أولاً.');
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', 'Bearer ' + token);
    headers.set('Accept', 'application/json');
    const res = await fetch(GRAPH + path, { ...options, headers });
    if (!res.ok) throw new Error(`Microsoft Graph ${res.status}: ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }

  const api = {
    me: () => request('/me?$select=id,displayName,mail,userPrincipalName,jobTitle'),
    schools: () => request('/education/me/schools'),
    classes: () => request('/education/me/classes'),
    taughtClasses: () => request('/education/me/taughtClasses'),
    assignments: () => request('/education/me/assignments'),
    classMembers: (classId) => request(`/education/classes/${encodeURIComponent(classId)}/members`),
    classTeachers: (classId) => request(`/education/classes/${encodeURIComponent(classId)}/teachers`),
    classAssignments: (classId) => request(`/education/classes/${encodeURIComponent(classId)}/assignments`),
    health: async () => { try { await api.me(); return { ok: true }; } catch (error) { return { ok: false, error: error.message }; } }
  };

  window.HAKIM_GRAPH = api;
})();
