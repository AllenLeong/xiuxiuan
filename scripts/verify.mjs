import {scenario,observe,SCENARIOS} from '../src/scenarios.js';
import {FLOWS} from '../src/world.js';
import {criteria,checkpoints,SPEC_VERSION} from '../verification/scenario-spec.js';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const sourceFiles=['src/world.js','src/qi-transport.js','src/ancient-influence.js','src/regions.js','src/region-geometry.js','src/species.js','src/geography.js','src/terrain.js','src/validate-state.js','src/landforms.js','src/scenarios.js','verification/scenario-spec.js','scripts/verify.mjs'];
const report={date:new Date().toISOString(),specVersion:SPEC_VERSION,mode:'Node deterministic scenario verification; not browser UX or FPS evidence',sourceHashes:Object.fromEntries(sourceFiles.map(p=>[p,hash(readFileSync(p))])),results:[],passed:true};
mkdirSync('evidence/scenarios',{recursive:true});
for(const[id,name] of SCENARIOS){
 const branches={};
 for(const variant of ['treatment','control',...(id==='S11'?['no-root','unfit']:[])]){
  const {world:w,center,region}=scenario(id,variant),initial=w.serialize(),json=JSON.stringify(initial),path=`evidence/scenarios/${id}-${variant}.json`;
  writeFileSync(path,json);
  const flow=Object.fromEntries(FLOWS.map(f=>[f,0])),centerFlow={...flow},trace=[];
  let errorMax=0,invalid=0,negative=0,capacityViolations=0,treeProcessing=0,treeAbsorb=0;
  const snapshot=()=>({...observe(w,region,center),neighborGrass:[center-1,center+1,center-32,center+32].reduce((s,i)=>s+w.count[i*2],0)});
  trace.push(snapshot());
  for(let step=1;step<=400;step++){
   w.step();errorMax=Math.max(errorMax,Math.abs(w.lastAudit.error));
   for(const f of FLOWS){centerFlow[f]+=w.flows[f][center];for(const i of region)flow[f]+=w.flows[f][i];}
   treeProcessing+=w.plantProcessing[center*2+1];treeAbsorb+=w.plantAbsorb[center*2+1];
   for(const f of ['ground','air','mineral','soil','detritus','qi','mass','life'])for(const value of w[f]){if(!Number.isFinite(value))invalid++;if(value< -1e-9)negative++;}
   for(let i=0;i<w.n;i++){if(w.ground[i]>w.capacity[i]+1e-8)capacityViolations++;for(let l=0;l<2;l++){const k=i*2+l;if(w.count[k]&&w.qi[k]>w.mass[k]*w.s(k).capacity+1e-7)capacityViolations++;}}
   if(checkpoints.includes(w.year))trace.push(snapshot());
  }
  branches[variant]={initialPath:path,initialHash:hash(json),seed:w.seed,size:w.size,center,region,config:w.config,initialDeath:initial.events.find(e=>e.type==='实验起点古树死亡'),interventions:w.edits.map(({year,step,cmd,delta})=>({year,step,cmd,delta})),trace,final:trace.at(-1),flow,centerFlow,treeProcessing,treeAbsorb,audit:{errorMax,balanceError:w.total()-w.initial-w.input-w.manual+w.escaped,invalid,negative,capacityViolations}};
 }
 const checks=criteria[id].map(([description,check])=>({description,passed:!!check(branches)}));
 for(const [variant,b]of Object.entries(branches))checks.push({description:`${variant}: 全期无无效值、负库存、超承载；累计账差在 1e-6 内`,passed:b.audit.invalid===0&&b.audit.negative===0&&b.audit.capacityViolations===0&&Math.abs(b.audit.balanceError)<1e-6});
 const passed=checks.every(c=>c.passed);report.results.push({id,name,passed,checks,branches});report.passed&&=passed;console.log(`${passed?'PASS':'FAIL'} ${id} ${name}`,checks.filter(c=>!c.passed).map(c=>c.description).join('; '));
}
writeFileSync('evidence/scenarios-report.json',JSON.stringify(report,null,2));
writeFileSync('evidence/scenarios-report.md',`# 受控场景验收\n\n${report.date} · ${SPEC_VERSION}\n\n仅证明下列固定初始条件与窗口，不能替代随机世界、浏览器体验或长期性能验收。完整参数、逐期数据、来源散列及对照存档见 scenarios-report.json 与 scenarios/。\n\n| 场景 | 结论 | 检查 |\n| --- | --- | --- |\n`+report.results.map(r=>`| ${r.id} ${r.name} | ${r.passed?'通过':'失败'} | ${r.checks.map(c=>`${c.passed?'✓':'✗'} ${c.description}`).join('<br>')} |`).join('\n')+'\n');
if(!report.passed)process.exitCode=1;
