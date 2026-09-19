import test from 'node:test';import assert from 'node:assert/strict';
import{World}from'../src/world.js';import{auditSnapshot,auditStep}from'../verification/step-audit.js';
test('per-pool auditor catches offsetting corruption hidden by a global total',()=>{const w=new World(16,'audit');const before=auditSnapshot(w);w.step();assert.equal(auditStep(w,before).budget,0);w.air[0]+=1;w.soil[0]-=1;assert.ok(auditStep(w,before).budget>=2);});
