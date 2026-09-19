import test from 'node:test';import assert from 'node:assert/strict';import{World}from'../src/world.js';
test('natural ancient promotion splits an existing individual without creating biomass or qi',()=>{
 const w=new World(16,'ancient-promotion',{escapeRate:0,groundDiffusion:0,surfaceDiffusion:0,feedback:0,maturation:0});
 for(let k=0;k<w.n*2;k++)w.kill(k);w.seedBank.fill(0);w.height.fill(.4);w.lakeDepth.fill(0);
 for(const f of ['production','outlet','soilBindRate','soilReleaseRate'])w[f].fill(0);
 w.baseTemp.fill(21);w.temp.fill(21);w.baseWater.fill(.55);w.water.fill(.55);w.sun.fill(.75);
 Object.assign(w.species[6],{growth:0,fertility:0,process:0,root:0,absorb:0,release:0});
 const i=136,k=i*2+1;w.establish(i,6,2,3);w.qi[k]=600;w.cohortCount.fill(0,k*8,k*8+8);w.addCohort(k,1,100);w.addCohort(k,1,200);w.refreshLife(k);
 const mass=w.mass[k],total=w.total();w.step();const anc=w.ancients[k];assert.ok(anc);assert.equal(w.count[k],2);assert.equal(w.mass[k],mass);assert.ok(Math.abs(w.total()-total)<1e-7);assert.equal(anc.age,200.25);assert.equal(anc.mass,3);assert.ok(anc.qi<=w.qi[k]);assert.equal(w.cohortCount.slice(k*8,k*8+8).reduce((a,b)=>a+b)+1,2);
 const loaded=World.load(w.serialize());assert.deepEqual(loaded.ancients[k],anc);const stocks=loaded.local(i);loaded.edit({i,kind:'death',layer:1,value:0});assert.ok(Math.abs(loaded.local(i)-stocks)<1e-7);assert.equal(loaded.count[k],0);assert.equal(loaded.ancients[k],undefined);
});
