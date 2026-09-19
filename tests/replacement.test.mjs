import test from 'node:test';import assert from 'node:assert/strict';import{World}from'../src/world.js';
function setup(count,healthy,seeded=true){
 const w=new World(16,'replacement-controls',{groundDiffusion:0,surfaceDiffusion:0,escapeRate:0,decompose:0,feedback:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);w.seedBank.fill(0);w.height.fill(.4);w.lakeDepth.fill(0);
 for(const f of ['ground','soil','detritus','mineral','production','outlet','soilBindRate','soilReleaseRate'])w[f].fill(0);
 w.air.fill(20);w.baseTemp.fill(21);w.temp.fill(21);w.baseWater.fill(.55);w.water.fill(.55);w.sun.fill(.75);
 for(const t of [2,3])Object.assign(w.species[t],{temp:21,water:.55,light:.75,fertility:0,growth:0,process:0,root:0,absorb:0,release:0});
 w.species[2].temp=healthy?21:80;
 w.establish(136,2,count);w.qi[272]=2;w.events=[];if(seeded)w.seedBank[136*8+3]=100;
 return w;
}
test('sparse unfit replacement sends all remaining old qi to detritus and records both populations',()=>{
 const w=setup(1,false);const total=w.total();w.step();
 assert.equal(w.type[272],3);assert.ok(w.count[272]>0);assert.equal(w.qi[272],0);assert.ok(Math.abs(w.detritus[136]-2)<1e-10);assert.ok(Math.abs(w.total()-total)<1e-7);
 const death=w.events.find(e=>e.type==='换种');assert.ok(death);assert.equal(death.species,2);assert.equal(death.before,1);assert.equal(death.after,0);assert.equal(death.destination,'遗骸');
 const birth=w.events.find(e=>e.type==='建立'&&e.species===3);assert.ok(birth);assert.equal(birth.before.species,2);assert.equal(birth.after.species,3);assert.equal(birth.seedBefore-birth.seedAfter,birth.after.count);
 assert.equal(w.cohortCount.slice(272*8,273*8).reduce((a,b)=>a+b),w.count[272]);
});
test('replacement requires both sparse and unhealthy old population plus actual seeds',()=>{
 for(const [count,healthy,seeded] of [[20,false,true],[1,true,true],[1,false,false]]){const w=setup(count,healthy,seeded);w.step();assert.equal(w.type[272],2);assert.ok(!w.events.some(e=>e.type==='换种'));}
});
