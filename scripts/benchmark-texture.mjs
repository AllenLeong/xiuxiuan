import {MapView,LAYERS} from '../src/map.js';
import {MapView as Before} from '../evidence/source-baselines/map-pre-texture-cache.js';
import {World} from '../src/world.js';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const make=(C,w)=>Object.assign(Object.create(C.prototype),{rendering:true,state:{size:w.size,map:w},texture:{width:0,height:0},tex:{createImageData(width,height){return {data:new Uint8ClampedArray(width*height*4)};},putImageData(image){this.pixels=image.data;}}});
const w=new World(256,'青野-001',{climate:24,rain:.5}),before=make(Before,w),after=make(MapView,w),results=[];
for(const [layer] of LAYERS){before.layer=after.layer=layer;before.build();after.build();assert.deepEqual(after.tex.pixels,before.tex.pixels);results.push({layer,identical:true,hash:createHash('sha256').update(after.tex.pixels).digest('hex')});}
before.layer=after.layer='natural';const timings={before:[],after:[]};
for(let round=0;round<32;round++)for(const name of round%2?['after','before']:['before','after']){const m=name==='before'?before:after,t=performance.now();m.build();if(round>=2)timings[name].push(performance.now()-t);}
const retained=after.imageData;after.build();assert.equal(after.imageData,retained);
const small=new World(16,'resize');after.state={size:16,map:small};before.state=after.state;before.build();after.build();assert.notEqual(after.imageData,retained);assert.deepEqual(after.tex.pixels,before.tex.pixels);
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const report={date:new Date().toISOString(),scope:'Node pixel generation only; excludes browser upload, composition and drawing. Alternating order, 2 warmups and 30 measured samples each.',size:256,results,bufferReuse:true,resizeIdentical:true,timings,meanMs:{before:mean(timings.before),after:mean(timings.after)},speedup:mean(timings.before)/mean(timings.after)};
writeFileSync('evidence/texture-optimization.json',JSON.stringify(report,null,2));console.log(JSON.stringify({meanMs:report.meanMs,speedup:report.speedup,identicalLayers:results.length}));
