import {regionRings} from '../src/region-geometry.js';
import {regionRings as before} from '../evidence/source-baselines/region-geometry-pre-rings.js';
import {significantRegions} from '../src/regions.js';
import {World} from '../src/world.js';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const w=World.load(JSON.parse(readFileSync('/Users/a/Downloads/青野-青野-001-502.5年.json','utf8'))),items=[...w.regions.items,...significantRegions(w.regions)];
for(const r of items)assert.deepEqual(regionRings(r.cells,w.size),before(r.cells,w.size));
const timings={before:[],after:[]};for(let i=0;i<14;i++)for(const name of i%2?['after','before']:['before','after']){const t=performance.now();for(const r of items)(name==='before'?before:regionRings)(r.cells,w.size);if(i>=4)timings[name].push(performance.now()-t);}
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;const report={size:w.size,year:w.year,items:items.length,identical:true,timings,means:{before:mean(timings.before),after:mean(timings.after)}};writeFileSync('evidence/ring-speed.json',JSON.stringify(report,null,2));console.log(report.means);
