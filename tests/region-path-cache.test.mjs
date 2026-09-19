import test from 'node:test';import assert from 'node:assert/strict';
import {RegionPathCache} from '../src/region-path-cache.js';
test('reuse exact region geometry across metric snapshots; invalidate changed cells, size and evictions',()=>{
 const cache=new RegionPathCache(2);let calls=0;const build=()=>({serial:++calls});
 const a={id:1,cells:[1,2,3],temperature:20},p=cache.get(a,16,build);
 assert.equal(cache.get({...a,cells:[1,2,3],temperature:30},16,build),p);
 assert.notEqual(cache.get({...a,cells:[1,2,4]},16,build),p);
 assert.equal(calls,2);cache.get(a,32,build);cache.get({id:2,cells:[5]},16,build);
 assert.equal(cache.entries.size,2);cache.get(a,16,build);assert.equal(calls,5);
});
