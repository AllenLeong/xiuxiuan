import {World} from '../src/world.js';
import {auditSnapshot,auditStep} from './step-audit.js';
const at=(x,y)=>y*16+x,source=at(2,8),sink=at(13,8),direct=at(8,8),detour=at(8,4);

function fixture(){
 const w=new World(16,'stable-surface-network',{groundDiffusion:0,surfaceDiffusion:1,escapeRate:.06,feedback:0,maturation:0,decompose:0,mineralRate:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);w.seedBank.fill(0);w.lakeDepth.fill(0);w.height.fill(.4);
 for(const f of ['ground','air','mineral','soil','detritus','production','outlet','surfaceNorth','surfaceSouth','surfaceEast','surfaceWest','soilBindRate','soilReleaseRate','groundGatherRate','gatherRate'])w[f].fill(0);
 w.capacity.fill(1000);w.airCapacity.fill(1000);w.baseTemp.fill(21);w.temp.fill(21);w.baseWater.fill(.55);w.water.fill(.55);w.sun.fill(.75);
 const join=(a,b)=>{if(b===a+1)w.surfaceEast[a]=w.surfaceWest[b]=1;else w.surfaceSouth[a]=w.surfaceNorth[b]=1;};
 for(let x=2;x<13;x++)join(at(x,8),at(x+1,8));
 for(let y=4;y<8;y++){join(at(6,y),at(6,y+1));join(at(10,y),at(10,y+1));}
 for(let x=6;x<10;x++)join(at(x,4),at(x+1,4));
 w.production[source]=4;w.outlet[source]=.1;
 Object.assign(w.species[6],{temp:21,water:.55,light:.75,need:0,shade:0,growth:0,fertility:0,life:100000,process:0,root:0,absorb:8,release:0,capacity:100000});
 w.establish(sink,6,1);w.events=[];return w;
}
function snapshot(w){return {year:w.year,sourceGround:w.ground[source],sourceAir:w.air[source],sinkAir:w.air[sink],sinkStored:w.qi[sink*2+1],uptake:w.plantAbsorb[sink*2+1],direct:w.airEast[direct],detour:w.airEast[detour],air:[...w.air],east:[...w.airEast],south:[...w.airSouth]};}
function advance(w,count){let violations=0,maxRelativeError=0,uptake=0;for(let i=0;i<count;i++){const before=auditSnapshot(w);w.step();const a=auditStep(w,before);violations+=a.invalid+a.negative+a.capacity+a.budget;maxRelativeError=Math.max(maxRelativeError,a.maxRelativeError);uptake+=w.plantAbsorb[sink*2+1];}return{violations,maxRelativeError,totalAbsorbed:uptake};}
function difference(a,b){let numerator=0,denominator=0;for(const field of ['air','east','south'])for(let i=0;i<a[field].length;i++){numerator+=Math.abs(a[field][i]-b[field][i]);denominator+=Math.abs(a[field][i]);}return numerator/Math.max(1e-12,denominator);}
export function stableChannels(){
 const w=fixture(),structure=['surfaceNorth','surfaceSouth','surfaceEast','surfaceWest'].map(f=>[f,[...w[f]]]);
 const checkpoints=[],audits=[];for(const year of [200,400,800,1000,2000,3000,4000]){audits.push(advance(w,Math.round((year-w.year)/w.config.dt)));checkpoints.push(snapshot(w));}
 const structureUnchanged=structure.every(([f,v])=>v.every((x,i)=>x===w[f][i]));
 const branches=[];for(const mode of ['unchanged','detour-only','disconnected']){
  const b=World.load(w.serialize());
  if(mode!=='unchanged')b.edit({i:direct,kind:'field',field:'surfaceEast',value:0});
  if(mode==='disconnected')b.edit({i:detour,kind:'field',field:'surfaceEast',value:0});
  const audit=advance(b,800);branches.push({mode,...audit,...snapshot(b)});
 }
 const earlyRelativeChange=difference(checkpoints[2],checkpoints[3]),lateRelativeChange=difference(checkpoints.at(-2),checkpoints.at(-1)),[normal,bypass,blocked]=branches;
 const checks={structureUnchanged,lateRelativeChangeBelowOneInTenThousand:lateRelativeChange<1e-4,positiveSteadySupply:normal.uptake>1e-6,directCutStopsDirectFlow:bypass.direct===0,existingDetourCarriesMore:bypass.detour>normal.detour,detourReachesSink:bypass.uptake>1e-6&&bypass.uptake<normal.uptake,noInventedBypass:blocked.direct===0&&blocked.detour===0&&blocked.uptake<normal.uptake*1e-4,audits:[...audits,...branches].every(a=>a.violations===0)};
 return{scope:'16² controlled stationary source, fixed long-lived nonsaturating absorber, two explicitly connected paths; 4000-year convergence (including the failed 800-to-1000-year settling window) plus three 200-year continuations. Does not establish natural continent channel stability.',seed:w.seed,dt:w.config.dt,source,sink,direct,detour,earlyRelativeChange,lateRelativeChange,structureUnchanged,checkpoints,branches,audits,checks};
}
