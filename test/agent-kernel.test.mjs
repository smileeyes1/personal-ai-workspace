import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, canAct, runMission, STATES } from '../agent-kernel.js';

test('mission starts resumable', () => {
  const m=createMission({intent:'prepare lesson',actor:{id:'t1',tenantId:'t1',roles:['teacher']}});
  assert.equal(m.state,STATES.RECEIVED);
  assert.equal(m.nextAction,STATES.UNDERSTAND);
});

test('authorization blocks tenant mismatch and risky writes without approval', () => {
  const actor={id:'t1',tenantId:'a',roles:['teacher']};
  assert.equal(canAct({actor,action:{type:'read',tenantId:'a'}}).allowed,true);
  assert.equal(canAct({actor,action:{type:'read',tenantId:'b'}}).reason,'TENANT_MISMATCH');
  assert.equal(canAct({actor,action:{type:'publish',riskLevel:'external_write'}}).reason,'APPROVAL_REQUIRED');
});

test('mission reaches complete through the governed lifecycle', async () => {
  const m=createMission({intent:'x',actor:{id:'t1'}});
  const handlers={};
  for(const s of [STATES.UNDERSTAND,STATES.CONTEXT,STATES.PLAN,STATES.EXECUTE,STATES.VERIFY,STATES.CRITIQUE,STATES.REPAIR,STATES.REGRESSION,STATES.APPROVAL,STATES.DELIVER,STATES.LEARN]) handlers[s]=async()=>({});
  await runMission(m,handlers);
  assert.equal(m.state,STATES.COMPLETE);
  assert.equal(m.nextAction,null);
});
