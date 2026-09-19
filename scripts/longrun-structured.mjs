import {World} from '../src/world.js';
import {auditSnapshot,auditStep} from '../verification/step-audit.js';
import {validateState} from '../src/validate-state.js';
import os from 'node:os';import {createHash} from 'node:crypto';import{readFileSync,writeFileSync}from'node:fs';
const files=['src/world.js','src/qi-transport.js','src/ancient-influence.js','src/regions.js','src/region-geometry.js','src/species.js','src/terrain.js','src/geography.js','src/landforms.js','src/validate-state.js','verification/step-audit.js','scripts/longrun-structured.mjs'];
const report={started:new Date().toISOString(),mode:'Node headless; includes audit overhead; not browser FPS',size:256,dt:.25,years:500,seeds:['验收-101','验收-202','验收-303','验收-404','验收-505'],machine:{cpu:os.cpus()[0].model,memory:os.totalmem(),os:os.release(),node:process.version},sourceHashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')])),runs:[],complete:false};
const observation=w=>{const air=Array.from(w.air).sort((a,b)=>a-b),stages={};for(let k=0;k<w.n*2;k++)if(w.count[k]&&w.species[w.type[k]].spirit)stages[w.stage[k]]=(stages[w.stage[k]]||0)+w.count[k];const areas={};for(const dimension of ['landform','thermal','forest','qi','ancient']){const regions=w.regions.items.filter(r=>r.dimension===dimension&&r.status!=='candidate');areas[dimension]={count:regions.length,covered:new Set(regions.flatMap(r=>r.cells)).size};}return{airQuantiles:[.5,.9,.99,1].map(q=>air[Math.min(air.length-1,Math.floor(q*air.length))]),airAbove50:air.filter(v=>v>50).length,plantQi:w.qi.reduce((a,b)=>a+b,0),stages,areas};};
const save=()=>writeFileSync('evidence/longrun-gathering.json',JSON.stringify(report,null,2)+'\n');
for(const seed of report.seeds){
 const start=performance.now(),w=new World(256,seed,{climate:24,rain:.5}),run={seed,generationMs:performance.now()-start,steps:0,invalid:0,negative:0,capacity:0,budget:0,maxRelativeError:0,firstFailure:null,checkpoints:[]};report.runs.push(run);save();try{validateState(w);}catch(e){run.invalid++;run.firstFailure={year:0,detail:e.message};}const begin=performance.now();
 for(let k=0;k<2000;k++){
  const before=auditSnapshot(w);w.step();const a=auditStep(w,before);for(const f of ['invalid','negative','capacity','budget'])run[f]+=a[f];run.maxRelativeError=Math.max(run.maxRelativeError,a.maxRelativeError);if(a.firstFailure)run.firstFailure??={year:w.year,...a.firstFailure};run.steps=w.steps;
  if((k+1)%100===0){try{validateState(w);}catch(e){run.invalid++;run.firstFailure??={year:w.year,detail:e.message};}run.elapsedMs=performance.now()-begin;run.cumulativeAbsoluteError=w.errorAbsolute;run.balanceError=w.total()-w.initial-w.input-w.manual+w.escaped;run.checkpoints.push({year:w.year,elapsedMs:run.elapsedMs,memory:process.memoryUsage(),total:w.total(),...w.refreshTotals(),...observation(w)});save();console.log(seed,w.year,'years; violations',run.invalid+run.negative+run.capacity+run.budget);}
 }
 run.pass=!run.invalid&&!run.negative&&!run.capacity&&!run.budget;save();
}
report.complete=true;report.finished=new Date().toISOString();report.pass=report.runs.every(r=>r.pass);save();
