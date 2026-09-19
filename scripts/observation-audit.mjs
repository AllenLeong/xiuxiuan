import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {World} from '../src/world.js';

// Compare every serialized field, including RNG, events, edits and region history.
// No presentation-dependent exclusions are permitted.
const [mode,input,output,stepsText='400']=process.argv.slice(2);
if(!['simulate','fingerprint'].includes(mode)||!input||!output)throw Error('Usage: node scripts/observation-audit.mjs simulate|fingerprint input.json output.json [steps]');
const raw=readFileSync(input),initial=JSON.parse(raw),steps=Number(stepsText);
const hash=s=>createHash('sha256').update(s).digest('hex');
function canonical(v){
 if(Array.isArray(v))return v.map(canonical);
 if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));
 return v;
}
let data=initial;const started=performance.now();
if(mode==='simulate'){
 if(!Number.isInteger(steps)||steps<0)throw Error('Invalid steps');
 const w=World.load(initial);for(let i=0;i<steps;i++)w.step();w.refreshTotals();data=w.serialize();
}
const fields=Object.fromEntries(Object.keys(data).sort().map(k=>[k,hash(JSON.stringify(canonical(data[k])))]));
const sourceFiles=['src/world.js','src/qi-transport.js','src/ancient-influence.js','src/regions.js','src/region-geometry.js','src/species.js','src/terrain.js','src/geography.js','src/landforms.js','src/validate-state.js','src/worker.js','src/app.js'];
const report={date:new Date().toISOString(),mode,input,inputHash:hash(raw),seed:data.seed,size:data.size,year:data.year,steps:data.steps,elapsedMs:performance.now()-started,fields,fullHash:hash(JSON.stringify(fields)),sourceHashes:Object.fromEntries(sourceFiles.map(f=>[f,hash(readFileSync(f))]))};
const comparisonPath=process.argv[6];
if(comparisonPath){
 const other=JSON.parse(readFileSync(comparisonPath)),diff={numericCount:0,nonNumericCount:0,maxAbsolute:0,maxRelativeToUnit:0,examples:[]};
 function compare(a,b,path){
  if(a===b)return;
  if(typeof a==='number'&&typeof b==='number'){
   const delta=Math.abs(a-b);diff.numericCount++;if(delta>diff.maxAbsolute)diff.largest={path,a,b,delta};diff.maxAbsolute=Math.max(diff.maxAbsolute,delta);diff.maxRelativeToUnit=Math.max(diff.maxRelativeToUnit,delta/Math.max(1,Math.abs(a),Math.abs(b)));
   if(diff.examples.length<8)diff.examples.push({path,a,b,delta});return;
  }
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
   for(const k of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[k],b[k],path+'.'+k);return;
  }
  diff.nonNumericCount++;if(diff.examples.length<8)diff.examples.push({path,a,b});
 }
 compare(data,other,'state');report.comparison={file:comparisonPath,...diff};
}
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,year:report.year,steps:report.steps,fields:Object.keys(fields).length,fullHash:report.fullHash}));
