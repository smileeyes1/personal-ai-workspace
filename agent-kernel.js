/* HAKIM EDU Ω — resumable, provider-agnostic mission kernel. */

const STATES = Object.freeze({RECEIVED:'RECEIVED',UNDERSTAND:'UNDERSTAND',CONTEXT:'CONTEXT',PLAN:'PLAN',EXECUTE:'EXECUTE',VERIFY:'VERIFY',CRITIQUE:'CRITIQUE',REPAIR:'REPAIR',REGRESSION:'REGRESSION',APPROVAL:'APPROVAL',DELIVER:'DELIVER',LEARN:'LEARN',BLOCKED:'BLOCKED',COMPLETE:'COMPLETE'});
const now=()=>new Date().toISOString();
const newId=()=>`mission_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;

export function createMission({intent,actor=null,context={},policy={}}={}) {
  if(!intent||typeof intent!=='string') throw new TypeError('Mission intent is required.');
  return {id:newId(),version:1,createdAt:now(),updatedAt:now(),state:STATES.RECEIVED,actor,intent:intent.trim(),context,policy,plan:[],completed:[],pending:[],blockers:[],evidence:[],artifacts:[],approvals:[],failures:[],recoveryAttempts:0,audit:[],nextAction:STATES.UNDERSTAND};
}

export function transition(mission,state,detail={}) {
  if(!mission||!Object.values(STATES).includes(state)) throw new TypeError('Invalid mission transition.');
  const from=mission.state; mission.state=state; mission.updatedAt=now();
  mission.audit.push({at:mission.updatedAt,from,to:state,...detail});
  mission.nextAction=state===STATES.COMPLETE?null:(detail.nextAction||state); return mission;
}

export function recordFailure(mission,failure,recovery={}) {
  mission.failures.push({at:now(),...failure}); mission.recoveryAttempts+=1;
  mission.audit.push({at:now(),event:'RECOVERY',failure,recovery});
  if(recovery.nextState) transition(mission,recovery.nextState,{reason:'recovery',failure:failure.message}); return mission;
}

export function needsApproval(action,policy={}) {
  const level=action?.riskLevel||'low', configured=policy.approvalLevels||{};
  if(configured[level]!==undefined) return configured[level]===true;
  return ['external_write','student_impact','sensitive_data','institutional_admin'].includes(level);
}

export function canAct({actor,action,policy={}}={}) {
  if(!action?.type) return {allowed:false,reason:'ACTION_TYPE_REQUIRED'};
  if(!actor) return {allowed:false,reason:'ACTOR_REQUIRED'};
  if(action.tenantId&&actor.tenantId&&action.tenantId!==actor.tenantId) return {allowed:false,reason:'TENANT_MISMATCH'};
  if(Array.isArray(action.requiredRoles)&&!action.requiredRoles.every(r=>actor.roles?.includes(r))) return {allowed:false,reason:'ROLE_REQUIRED'};
  if(needsApproval(action,policy)&&!action.approved) return {allowed:false,reason:'APPROVAL_REQUIRED'};
  return {allowed:true,reason:'AUTHORIZED'};
}

export async function runMission(mission,handlers={}) {
  const sequence=[STATES.UNDERSTAND,STATES.CONTEXT,STATES.PLAN,STATES.EXECUTE,STATES.VERIFY,STATES.CRITIQUE,STATES.REPAIR,STATES.REGRESSION,STATES.APPROVAL,STATES.DELIVER,STATES.LEARN];
  for(const state of sequence){
    if(mission.state===STATES.COMPLETE) break;
    const handler=handlers[state];
    if(!handler){ if(state===STATES.REPAIR) continue; if(state===STATES.APPROVAL){transition(mission,state,{nextAction:STATES.DELIVER});continue;} throw new Error(`Missing mission handler: ${state}`); }
    transition(mission,state);
    try{ const result=await handler(mission)||{}; if(result.evidence) mission.evidence.push(...result.evidence); if(result.artifacts) mission.artifacts.push(...result.artifacts); if(result.pending) mission.pending.push(...result.pending); if(result.blocker) mission.blockers.push(result.blocker); } catch(error){ recordFailure(mission,{state,message:error?.message||String(error)},{nextState:STATES.BLOCKED}); return mission; }
  }
  if(!mission.blockers.length&&mission.state!==STATES.BLOCKED) transition(mission,STATES.COMPLETE,{nextAction:null});
  return mission;
}

export {STATES};
