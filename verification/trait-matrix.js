import {World} from '../src/world.js';
function base(){
 const w=new World(16,'trait-matrix',{escapeRate:0,groundDiffusion:0,surfaceDiffusion:0,feedback:0,maturation:0,decompose:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);
 w.seedBank.fill(0);w.lakeDepth.fill(0);w.height.fill(.4);
 for(const f of ['ground','air','soil','mineral','detritus','production','outlet'])w[f].fill(0);
 w.temp.fill(21);w.baseTemp.fill(21);w.water.fill(.55);w.baseWater.fill(.55);w.sun.fill(.75);
 for(const s of w.species)Object.assign(s,{temp:21,water:.55,light:.75,fertility:0});
 w.events=[];return w;
}
const step=(w,n)=>{for(let i=0;i<n;i++)w.step();};
export function traitMatrix(){
 const results=[];
 const run=(trait,values,setup,measure,higher,steps=1)=>{
  const outcomes=values.map(value=>{const {w,t}=setup();w.species[t][trait]=value;step(w,steps);return measure(w);});
  results.push({trait,values,steps,years:steps*.25,outcomes,expectation:higher?'second > first':'second < first',pass:higher?outcomes[1]>outcomes[0]:outcomes[1]<outcomes[0]});
 };
 const grass=()=>{const w=base();w.establish(17,0,10);return{w,t:0};};
 run('temp',[21,40],grass,w=>w.mass[34],false);
 run('water',[.55,.15],grass,w=>w.mass[34],false);
 run('light',[.75,.15],grass,w=>w.mass[34],false);
 run('growth',[0,.9],grass,w=>w.mass[34],true);
 run('fertility',[0,1],grass,w=>w.seedBank.reduce((a,b)=>a+b,0),true);
 run('size',[1,8],grass,w=>w.mass[34],false);
 run('life',[.5,20],grass,w=>w.count[34],true,4);
 const shade=()=>{const w=base();w.establish(17,4,1,4);w.establish(17,0,10);w.species[4].growth=0;return{w,t:4};};
 run('shade',[0,1],shade,w=>w.mass[34],false);
 const spiritual=()=>{const w=base();w.establish(17,6,1);Object.assign(w.species[6],{process:0,absorb:0,root:0,release:0,shade:0});w.qi[35]=4;return{w,t:6};};
 run('need',[1,20],spiritual,w=>w.mass[35],false);
 const uptake=()=>{const o=spiritual();o.w.qi[35]=0;o.w.air[17]=100;o.w.species[6].absorb=10;return o;};
 const sources=()=>{const o=spiritual();o.w.qi[35]=0;o.w.air[17]=50;o.w.ground[17]=50;return o;};
 run('process',[0,4],sources,w=>w.plantProcessing[35],true);
 run('root',[0,4],sources,w=>w.plantRoot[35],true);
 run('absorb',[0,4],sources,w=>w.plantAbsorb[35],true);
 run('capacity',[1,100],uptake,w=>w.plantAbsorb[35],true);
 run('release',[0,1],uptake,w=>w.plantRelease[35],true);
 const adverse=field=>()=>{const o=grass();if(field==='temp')o.w.baseTemp[17]=o.w.temp[17]=33;else o.w.baseWater[17]=o.w.water[17]=.8;return o;};
 run('tol',[10,30],adverse('temp'),w=>w.mass[34],true);
 run('wt',[.2,.6],adverse('water'),w=>w.mass[34],true);
 const toxic=()=>{const o=spiritual();o.w.air[17]=400;return o;};
 run('tolerance',[100,800],toxic,w=>w.mass[35],true);
 return results;
}
