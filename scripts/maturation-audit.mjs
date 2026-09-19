import {World} from '../src/world.js';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='evidence/maturation-current.json';
const result={started:new Date().toISOString(),complete:false,seed:'验收-101',size:256,years:[0,20,40,60,80,100,500],threshold:20,note:'高值比例仅作观测，不定义灵地。两个分支仅改变 maturation；不要求所有格稳定。',sourceHashes:Object.fromEntries(['src/world.js','src/qi-transport.js','src/ancient-influence.js','src/regions.js','src/region-geometry.js','src/species.js','src/terrain.js','src/geography.js','src/landforms.js','scripts/maturation-audit.mjs'].map(p=>[p,createHash('sha256').update(readFileSync(p)).digest('hex')])),runs:[]};
const sum=a=>a.reduce((s,v)=>s+v,0);
function snapshot(w){
 const air=Array.from(w.air).filter((v,i)=>w.height[i]>=.23&&w.lakeDepth[i]<=.012).sort((a,b)=>a-b),stages={};
 for(let k=0;k<w.type.length;k++)if(w.count[k]&&w.species[w.type[k]].spirit)stages[w.stage[k]]=(stages[w.stage[k]]||0)+w.count[k];
 return{year:w.year,steps:w.steps,landCells:air.length,airQuantiles:Object.fromEntries([.1,.5,.9,.95,.99].map(p=>[p,air[Math.floor((air.length-1)*p)]])),highFraction:air.filter(v=>v>result.threshold).length/air.length,ground:sum(w.ground),plant:sum(w.qi),surface:sum(w.air),mineral:sum(w.mineral),detritus:sum(w.detritus),soil:sum(w.soil),input:w.input,escaped:w.escaped,manual:w.manual,total:w.total(),balanceError:w.total()-w.initial-w.input-w.manual+w.escaped,cumulativeAbsoluteError:w.errorAbsolute,stages};
}
result.complete=true;result.finished=new Date().toISOString();writeFileSync(path,JSON.stringify(result,null,2)+'\n');
for(const maturation of [1,0]){
 const w=new World(result.size,result.seed,{climate:24,rain:.5,maturation}),run={maturation,checkpoints:[snapshot(w)]},start=performance.now();result.runs.push(run);
 for(let step=1;step<=2000;step++){w.step();if(result.years.includes(w.year)){run.checkpoints.push(snapshot(w));run.elapsedMs=performance.now()-start;writeFileSync(path,JSON.stringify(result,null,2)+'\n');console.log(maturation,w.year,run.checkpoints.at(-1).highFraction);}}
}
