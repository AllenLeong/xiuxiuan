import {World} from '../src/world.js';
import {auditSnapshot,auditStep} from './step-audit.js';

// A closed acquired-qi budget. Birth/aging belongs to the separate innate ledger.
export function carrierCycle({bindRate=.08,releaseRate=.04,passage=.4}={}){
 const w=new World(16,'R20-closed-carriers',{escapeRate:0,groundDiffusion:0,surfaceDiffusion:1,feedback:0,maturation:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);
 w.seedBank.fill(0);
 for(const f of ['ground','air','mineral','soil','detritus','production','receive','outlet','surfaceNorth','surfaceSouth','surfaceEast','surfaceWest','soilBindRate','soilReleaseRate'])w[f].fill(0);
 w.baseTemp.fill(21);w.temp.fill(21);w.baseWater.fill(.55);w.water.fill(.55);w.sun.fill(.75);w.height.fill(.4);
 w.capacity.fill(1000);w.airCapacity.fill(1000);w.soilCapacity.fill(150);w.rock.fill(.9);
 const source=17,receiver=18;
 w.ground[source]=900;w.air[source]=100;w.outlet[source]=.005;
 w.surfaceEast[source]=w.surfaceWest[receiver]=passage;
 for(const i of [source,receiver]){w.soilBindRate[i]=bindRate;w.soilReleaseRate[i]=releaseRate;}
 Object.assign(w.species[6],{process:0,root:5,absorb:.4,release:.3,life:24,growth:0,fertility:0,shade:0});
 Object.assign(w.species[2],{process:0,root:0,absorb:.4,release:.2,life:1000,growth:0,fertility:0,temp:21,water:.55,light:.75});
 w.establish(source,6,1,2);w.establish(receiver,2,10,1);
 const initial=w.total(),inputBefore=w.input,manualBefore=w.manual,escapedBefore=w.escaped;
 const sums=Object.fromEntries(['geology','processing','vent','root','absorb','release','litter','death','decompose','bind','weather','surfaceIn','surfaceOut'].map(k=>[k,0]));
 let maxRelativeError=0,violations=0,liveReleaseBeforeDeath=0;
 const checkpoints=[];
 for(let t=0;t<400;t++){
  const before=auditSnapshot(w);w.step();const audit=auditStep(w,before);
  maxRelativeError=Math.max(maxRelativeError,audit.maxRelativeError);
  violations+=audit.invalid+audit.negative+audit.capacity+audit.budget;
  for(const f in sums)for(const v of w.flows[f])sums[f]+=v;
  if(w.year<24&&w.count[source*2+1])liveReleaseBeforeDeath+=w.plantRelease[source*2+1];
  if([0,39,95,199,399].includes(t))checkpoints.push({year:w.year,total:w.total(),source:w.inspect(source),receiver:w.inspect(receiver)});
 }
 const pools=Object.fromEntries(['ground','air','mineral','soil','detritus','qi'].map(f=>[f,w[f].reduce((a,b)=>a+b,0)]));
 return {config:{bindRate,releaseRate,passage,seed:w.seed,size:w.size,steps:w.steps,years:w.year},initial,final:w.total(),externalInput:w.input-inputBefore,manual:w.manual-manualBefore,escaped:w.escaped-escapedBefore,pools,sums,liveReleaseBeforeDeath,violations,maxRelativeError,checkpoints};
}
