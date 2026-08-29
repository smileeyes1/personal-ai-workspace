import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Test Error Classification Deterministically
function classifyGeminiError(err) {
  const errMsg = err?.message || String(err || '');
  const errStr = JSON.stringify(err || {});
  let status = err?.status;
  if (!status) {
    if (errMsg.includes('429')) status = 429;
    else if (errMsg.includes('403')) status = 403;
    else if (errMsg.includes('401')) status = 401;
    else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503') || errMsg.includes('504')) status = 500;
    else status = 0;
  }

  let retryDelaySec = 0;
  const delayMatch = errMsg.match(/retry in\s+([0-9.]+)\s*s/i) || errMsg.match(/"retryDelay":\s*"([0-9]+)s"/i);
  if (delayMatch && delayMatch[1]) {
    retryDelaySec = Math.ceil(parseFloat(delayMatch[1]));
  }

  const isDailyQuota = /GenerateRequestsPerDay|limit:\s*20|RESOURCE_EXHAUSTED|Quota exceeded/i.test(errMsg) || /GenerateRequestsPerDay/i.test(errStr);
  const isRateLimit = status === 429 || /429|RESOURCE_EXHAUSTED|rate-limit|Rate limit|rate limit/i.test(errMsg);
  const isAuth = status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED/i.test(errMsg);
  const isServer = status >= 500 && status <= 599;
  const isNetwork = /fetch failed|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|AbortError/i.test(errMsg);

  let type = 'UNKNOWN';
  if (isAuth) type = 'AUTH_ERROR';
  else if (isDailyQuota) type = 'DAILY_QUOTA_EXHAUSTED';
  else if (isRateLimit) type = 'TRANSIENT_RATE_LIMIT';
  else if (isServer) type = 'SERVER_ERROR';
  else if (isNetwork) type = 'NETWORK_ERROR';

  return { status, type, retryDelaySec };
}

describe('Deterministic Error Classifier', () => {
  it('identifies daily quota exhaustion correctly', () => {
    const err = { message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20' };
    const res = classifyGeminiError(err);
    assert.equal(res.type, 'DAILY_QUOTA_EXHAUSTED');
  });

  it('identifies transient rate limit and parses delay seconds', () => {
    const err = { message: 'Rate limit. Please retry in 35.4s.' };
    const res = classifyGeminiError(err);
    assert.equal(res.type, 'TRANSIENT_RATE_LIMIT');
    assert.equal(res.retryDelaySec, 36);
  });

  it('identifies network failure', () => {
    const err = { message: 'fetch failed: ECONNREFUSED' };
    const res = classifyGeminiError(err);
    assert.equal(res.type, 'NETWORK_ERROR');
  });

  it('identifies auth errors', () => {
    const err = { status: 403, message: 'API_KEY_INVALID' };
    const res = classifyGeminiError(err);
    assert.equal(res.type, 'AUTH_ERROR');
  });
});
