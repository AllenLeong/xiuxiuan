import {World} from '../src/world.js';
import {auditSnapshot,auditStep} from './step-audit.js';
function base(){
 const w=new World(16,'transport-controls',{groundDiffusion:.12,surfaceDiffusion:0,escapeRate:0,feedback:0,maturation:0,decompose:0,mineralRate:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);
 w.seedBank.fill(0);w.lakeDepth.fill(0);w.height.fill(.4);w.capacity.fill(1000);w.conduct.fill(1);
 for(const f of ['ground','air','mineral','soil','detritus','production','outlet','groundGatherRate','gatherRate'])w[f].fill(0);
 w.temp.fill(21);w.baseTemp.fill(21);w.water.fill(.55);w.baseWater.fill(.55);w.sun.fill(.75);
 Object.assign(w.species[6],{temp:21,water:.55,light:.75,need:0,shade:0,growth:0,fertility:0,life:100000,process:0,root:8,absorb:0,release:0,capacity:100000});
 w.events=[];return w;
}
function advance(w,steps,tree,other=-1){
 let uptake=0,intercept=0,maxError=0,failures=0;
 for(let k=0;k<steps;k++){const before=auditSnapshot(w);w.step();const a=auditStep(w,before);maxError=Math.max(maxError,a.maxRelativeError);failures+=a.budget+a.invalid+a.negative+a.capacity;uptake+=w.plantRoot[tree*2+1];if(other>=0)intercept+=w.plantRoot[other*2+1];}
 return{uptake,intercept,maxError,failures};
}
export function transportExperiments(){
 const center=8*16+8,radial=[];
 for(const root of [8,0]){
  const w=base();w.ground.fill(100);w.establish(center,6,1);w.species[6].root=root;
  w.step();const firstFar=w.ground[center-3],firstUptake=w.plantRoot[center*2+1],firstFarNet=w.flows.groundIn[center-3]-w.flows.groundOut[center-3];w.step();
  radial.push({root,firstFar,firstUptake,firstFarNet,center:w.ground[center],incoming:[w.groundEast[center-1],-w.groundEast[center],w.groundSouth[center-16],-w.groundSouth[center]],...advance(w,78,center)});
 }
 const chain=[],tree=8*16+13,interceptor=8*16+7;
 for(const mode of ['open','intercept','blocked']){
  const w=base();w.conduct.fill(0);for(let x=2;x<=13;x++)w.conduct[8*16+x]=1;
  w.production[8*16+2]=4;w.establish(tree,6,1);
  if(mode==='intercept')w.establish(interceptor,6,1);
  if(mode==='blocked')w.edit({i:8*16+9,kind:'field',field:'conduct',value:0});
  const run=advance(w,2000,tree,interceptor);chain.push({mode,years:w.year,source:w.ground[8*16+2],treeStock:w.qi[tree*2+1],...run});
 }
 const saturation=[];
 for(const full of [false,true]){const w=base();w.ground.fill(100);w.establish(center,6,1);w.species[6].capacity=10;if(full)w.qi[center*2+1]=10;saturation.push({full,...advance(w,4,center)});}
 const checks={radialInward:radial[0].incoming.every(v=>v>0),noUptakeNoInward:radial[1].incoming.every(v=>v===0),noTeleportation:Math.abs(radial[0].firstFar-100-radial[0].firstFarNet)<1e-9&&radial[0].firstUptake<=100,interception:chain[1].intercept>0&&chain[1].uptake<chain[0].uptake,disconnection:chain[2].uptake===0&&chain[0].uptake>0,saturation:saturation[1].uptake<saturation[0].uptake,audits:[...radial,...chain,...saturation].every(r=>r.failures===0)};
 return{size:16,dt:.25,seed:'transport-controls',note:'机制隔离实验；长寿命、关闭生长繁殖以排除生命周期变化。不用于证明随机大陆的长距离通道或性能。',radial,chain,saturation,checks};
}
