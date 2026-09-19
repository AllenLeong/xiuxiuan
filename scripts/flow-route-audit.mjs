import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {World} from '../src/world.js';
import {flowRoutes,flowSegmentAllowed} from '../src/flow-routes.js';
const sourceFiles=['src/world.js','src/terrain.js','src/flow-routes.js','src/flow-render.js','tests/flow-streamlines.test.mjs'];
const sources=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const w=new World(256,'青野-001');for(let i=0;i<40;i++)w.step();
const state={size:w.size,map:w,edgeFlowStep:w.edgeFlowStep},results=[];
for(const prefix of ['ground','air']){
 const start=performance.now(),r=flowRoutes(state,prefix),elapsedMs=performance.now()-start;
 let invalidCrossings=0,segments=0;const quadrants=[0,0,0,0];
 for(const route of r.routes){const p=route.points[Math.floor(route.points.length/2)];quadrants[(p[1]>=128?2:0)+(p[0]>=128?1:0)]++;
  for(let i=1;i<route.points.length;i++){segments++;if(!flowSegmentAllowed(state,prefix,route.points[i-1],route.points[i]))invalidCrossings++;}
 }
 const lengths=r.routes.map(route=>route.points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route.points[i][0],p[1]-route.points[i][1]),0)).sort((a,b)=>a-b);
 results.push({prefix,elapsedMs,routes:r.routes.length,segments,invalidCrossings,quadrants,lengthMedian:lengths[Math.floor(lengths.length/2)],lengthMax:lengths.at(-1),deterministic:JSON.stringify(r)===JSON.stringify(flowRoutes(state,prefix))});
}
const report={recordedAt:new Date().toISOString(),sources,seed:w.seed,size:w.size,year:w.year,step:w.steps,scope:'Node extraction cost and signed-face consistency only; not browser FPS, visual acceptance, or long-term channel stability.',results};
await writeFile('evidence/flow-route-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.results));
