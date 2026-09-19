import test from 'node:test';
import assert from 'node:assert/strict';
import {Landscape,PLANTS,SPECIES_COUNT} from '../feasibility/model.js';
import {temperatureColor,TEMPERATURE_STOPS,surfaceType,precipitation} from '../feasibility/ecology.js';
import {identifyRegions} from '../feasibility/regions.js';
import {existsSync} from 'node:fs';

test('plant identities carry distinct habitat, color and spiritual capabilities',()=>{
 assert.equal(SPECIES_COUNT,20);assert.equal(new Set(PLANTS.map(p=>p.color)).size,20);
 for(const p of PLANTS){assert.ok(p.tol>0&&p.wt>0);if(!p.capacity)assert.equal(p.process+p.absorb,0);}
 const w=new Landscape(),present=new Set(w.type);assert.ok(present.size>=18);
 for(let i=0;i<w.n;i++)for(let l=0;l<2;l++){const p=PLANTS[w.type[i*2+l]];if(!p)continue;assert.equal(p.layer,l);assert.ok(Math.abs(w.temp[i]-p.temp)<p.tol);assert.ok(Math.abs(w.water[i]-p.water)<p.wt);}
 const i=w.type.findIndex(t=>t===4)>>1;w.temp[i]=1000;assert.equal(w.fit(i,4),0,'ordinary pines cannot grow at a geothermal extreme');
 const old=w.total();w.edit(i,'remove');assert.ok(Math.abs(w.total()-old)<1e-7);
});

test('world temperature is bounded with sparse geographical tails across seeds and widths',()=>{
 for(const options of [{seed:'横陆-001'},{seed:'横陆-002'},{seed:'寒热验收',width:1024}]){
  const w=new Landscape(options);let outside=0,min=Infinity,max=-Infinity;const types=new Set();
  for(let i=0;i<w.n;i++){const t=w.temp[i];assert.ok(t>=-1000&&t<=1000);outside+=t< -40||t>60;min=Math.min(min,t);max=Math.max(max,t);types.add(surfaceType(w,i));assert.ok(Math.abs(w.rainfall[i]+w.snow[i]-w.rain[i])<1e-10);}
  assert.ok(outside/w.n<.04,'at least 96% remain in the ordinary band');assert.ok(min< -950&&max>950);assert.ok(types.has('沙漠')&&types.has('雪原')&&types.has('熔岩地')&&types.has('林地'));
 }
 for(const [t,c]of TEMPERATURE_STOPS)assert.deepEqual(temperatureColor(t),c);
 const w={temp:[-20],rain:[.8],snow:[0],rainfall:[0]};precipitation(w,0);assert.equal(w.snow[0],.8);w.temp[0]=20;precipitation(w,0);assert.equal(w.rainfall[0],.8);
});

test('regions have true connected boundaries, size gates and observable four-dimensional composites',()=>{
 const w=new Landscape(),r=identifyRegions(w);assert.deepEqual(Object.keys(r),['temperature','forest','terrain','qi','composite']);
 for(const [dimension,data]of Object.entries(r)){
  assert.ok(data.regions.length>0,dimension);
  for(const region of data.regions){assert.ok(region.area>=data.minimum);assert.ok(region.edges.length>0);const seen=new Set([region.cells[0]]),queue=[region.cells[0]];for(let k=0;k<queue.length;k++)for(const j of w.neighbors(queue[k]))if(data.ids[j]===region.id&&!seen.has(j)){seen.add(j);queue.push(j);}assert.equal(seen.size,region.area);for(const i of region.cells)assert.ok(w.land(i));if(dimension==='composite')assert.equal(region.label.split(' · ').length,4);}
 }
 // A region is observational: removing all biomass must remove the forest layer.
 w.mass.fill(0);const after=identifyRegions(w);assert.equal(after.forest.regions.length,0);
 assert.ok(existsSync(new URL('../feasibility/assets/terrain-atlas.png',import.meta.url)));assert.ok(existsSync(new URL('../feasibility/assets/vegetation-atlas.png',import.meta.url)));
});
