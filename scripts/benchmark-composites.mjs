import {significantRegions} from '../src/regions.js';
import {significantRegions as before} from '../evidence/source-baselines/regions-pre-sparse.js';
import {World} from '../src/world.js';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const w=World.load(JSON.parse(readFileSync('/Users/a/Downloads/青野-青野-001-502.5年.json','utf8'))),r=w.regions;
assert.deepEqual(significantRegions(r),before(r));const timings={before:[],after:[]};for(let i=0;i<24;i++)for(const name of i%2?['after','before']:['before','after']){const t=performance.now();(name==='before'?before:significantRegions)(r);if(i>=4)timings[name].push(performance.now()-t);}
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;const report={size:w.size,year:w.year,items:r.items.length,identical:true,timings,means:{before:mean(timings.before),after:mean(timings.after)}};writeFileSync('evidence/composite-speed.json',JSON.stringify(report,null,2));console.log(report.means);
