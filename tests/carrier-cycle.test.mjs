import test from 'node:test';
import assert from 'node:assert/strict';
import {carrierCycle} from '../verification/carrier-cycle.js';

test('R20 closed multi-carrier lifecycle transfers real qi with no external input',()=>{
 const r=carrierCycle();
 assert.equal(r.violations,0);assert.equal(r.externalInput,0);assert.equal(r.manual,0);assert.equal(r.escaped,0);
 assert.ok(Math.abs(r.final-r.initial)<1e-8);
 for(const f of ['vent','root','absorb','release','litter','death','decompose','bind','weather','surfaceIn','surfaceOut'])assert.ok(r.sums[f]>0,f);
 assert.ok(r.liveReleaseBeforeDeath>0);assert.ok(r.pools.mineral>0);
 assert.ok(Math.abs(r.sums.surfaceIn-r.sums.surfaceOut)<1e-9);
 assert.equal(r.checkpoints.at(-1).source.plants[1].count,0);
 assert.ok(r.checkpoints.at(-1).receiver.plants[0].qi>0);
});

test('R20 independent retention and connection changes preserve the closed budget',()=>{
 for(const bindRate of [0,.08])for(const releaseRate of [0,.04])for(const passage of [0,.4]){
  const r=carrierCycle({bindRate,releaseRate,passage});
  assert.equal(r.violations,0);assert.equal(r.externalInput,0);assert.ok(Math.abs(r.final-r.initial)<1e-8);
  if(!bindRate)assert.equal(r.pools.soil,0);
  if(!releaseRate)assert.equal(r.sums.weather,0);
  if(!passage){assert.equal(r.sums.surfaceIn,0);assert.equal(r.sums.surfaceOut,0);assert.equal(r.checkpoints.at(-1).receiver.plants[0].qi,0);}
 }
});
