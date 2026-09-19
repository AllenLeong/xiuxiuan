import test from 'node:test';import assert from 'node:assert/strict';import {World} from '../src/world.js';import {attractionField} from '../src/qi-transport.js';import {attractionField as reference} from '../evidence/source-baselines/gathering-pre-speed/qi-transport.js';
test('indexed solver preserves both full attraction fields across blocked, saturated and competing terrain',()=>{
 for(const seed of ['paths-1','paths-2','paths-3']){const w=new World(32,seed);for(let i=0;i<w.n;i++){if(i%7===0){w.conduct[i]=0;w.surfaceEast[i]=0;}if(i%11===0){w.air[i]=w.gatherLimit[i];w.ground[i]=w.capacity[i];}if(i%19===0)w.gatherRate[i]=50;}
  for(const ground of [false,true]){const a=attractionField(w,ground),b=reference(w,ground);assert.deepEqual(a.own,b.own);assert.deepEqual(a.potential,b.potential);}
 }
});
