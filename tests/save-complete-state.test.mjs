import test from 'node:test';import assert from 'node:assert/strict';import {World} from '../src/world.js';
const snapshot=w=>JSON.parse(JSON.stringify(w.serialize()));
test('complete serialized snapshot roundtrips before and between annual region updates',()=>{
 for(const steps of [0,4,5]){
  const a=new World(16,'whole-snapshot');a.edit({i:136,kind:'remove',layer:1,value:0});a.edit({i:136,kind:'plant',species:6,value:1,ancient:true});
  for(let i=0;i<steps;i++)a.step();const before=snapshot(a),b=World.load(before);
  assert.deepEqual(snapshot(b),before,`immediate restore at step ${steps}`);
  for(let i=0;i<8;i++){a.step();b.step();assert.deepEqual(snapshot(b),snapshot(a),`continuation ${steps}+${i+1}`);}
 }
});
