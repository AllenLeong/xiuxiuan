import test from 'node:test';
import assert from 'node:assert/strict';
import {drawMountains,mountainGeometry} from '../src/mountain-render.js';
test('mountain geometry and drawing remain fixed across zooms, including visible tops with offscreen bases',()=>{
 const n=64,m={height:new Float32Array(n*n).fill(.4),river:new Float32Array(n*n)};
 m.height[30*n+30]=.95;
 const peaks=mountainGeometry(m,n);assert.equal(peaks.length,1);
 function draw(view){const calls=[];const c=new Proxy({createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return o[k]||((...a)=>calls.push([k,...a]));},set(){return true;}});drawMountains(c,m,n,view);return calls;}
 const a=draw({x0:0,x1:n,y0:0,y1:n,z:.5}),b=draw({x0:0,x1:n,y0:0,y1:n,z:8});
 assert.deepEqual(a,b);assert.ok(a.length);
 const p=peaks[0];assert.ok(draw({x0:29,x1:32,y0:p.y-p.peak*p.unit,y1:p.y-.1,z:8}).length);
 assert.equal(mountainGeometry(m,n),peaks);
 const flat={height:new Float32Array(n*n).fill(.8),river:m.river};assert.equal(mountainGeometry(flat,n).length,0);
});
