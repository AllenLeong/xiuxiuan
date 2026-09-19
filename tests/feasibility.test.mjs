import test from 'node:test';import assert from 'node:assert/strict';
import {Landscape,terrainPassage} from '../feasibility/model.js';
function strip(stock,field,retention=[0,0,0]){
 const w=Object.create(Landscape.prototype);w.width=3;w.height=1;w.n=3;
 for(const k of ['blocked','delta','flowE','flowS','inflow','outflow','flowX','flowY','elevation','rock'])w[k]=new Float64Array(3);
 w.air=Float64Array.from(stock);w.field=Float64Array.from(field);w.retention=Float64Array.from(retention);w.diffusion=new Float64Array(3).fill(.3);return w;
}
test('new surface rule diffuses without attraction and preserves every transferred unit',()=>{
 const w=strip([9,0,0],[0,0,0]);w.transport();assert.ok(w.air[1]>0);assert.equal(w.air.reduce((a,b)=>a+b,0),9);assert.ok(w.flowE[0]>0);
 for(let i=0;i<200;i++)w.transport();assert.ok(Math.max(...w.air)-Math.min(...w.air)<1e-6);
});
test('attraction can overcome concentration gradient; retention reduces loss; capacity limits reception',()=>{
 const pulled=strip([2,1,0],[8,0,0]);pulled.transport();assert.ok(pulled.flowE[0]<0);
 const loose=strip([9,0,0],[0,0,0]),held=strip([9,0,0],[0,0,0],[.8,0,0]);loose.transport();held.transport();assert.ok(held.outflow[0]<loose.outflow[0]);
 const full=strip([100,100,100],[0,100,0]);full.transport();assert.deepEqual([...full.air],[100,100,100]);
});
test('rectangular generation is reproducible and provides seven plates, diverse habitats and connected ground routes',()=>{
 const a=new Landscape(),b=new Landscape();assert.equal(a.n,512*256);assert.equal(new Set(a.plate).size,7);assert.deepEqual(a.elevation,b.elevation);assert.deepEqual(a.type,b.type);
 assert.ok(a.heat.some(v=>v>12));assert.ok(a.temp.some(v=>v<0));assert.ok(a.temp.some(v=>v>35));assert.ok(a.lake.some(v=>v>.009));assert.ok(a.river.some(v=>v>2));assert.equal(a.routes.length,5);
 const seen=new Uint8Array(a.n),start=a.elevation.findIndex(v=>v>.205),queue=[start];seen[start]=1;for(let p=0;p<queue.length;p++)for(const j of a.neighbors(queue[p]))if(!seen[j]&&a.elevation[j]>.205){seen[j]=1;queue.push(j);}
 const landCount=a.elevation.reduce((n,v)=>n+(v>.205),0);
 assert.ok(queue.length/landCount>.97,'mainland remains dominant');
 const islands=[];for(let i=0;i<a.n;i++){if(seen[i]||a.elevation[i]<=.205)continue;const cells=[i];seen[i]=1;for(let k=0;k<cells.length;k++)for(const j of a.neighbors(cells[k]))if(!seen[j]&&a.elevation[j]>.205){seen[j]=1;cells.push(j);}islands.push(cells.length);}
 assert.equal(islands.length,4,'only four offshore islands');assert.ok(Math.max(...islands)>Math.min(...islands)*4,'unequal island sizes');
 const at=(x,y)=>a.elevation[Math.round(y*(a.height-1))*a.width+Math.round(x*(a.width-1))];
 assert.ok(at(0,.5)>.205,'western continental mass continues outside view');
 assert.ok(at(.40,.80)>.205,'southern continental mass');
 assert.ok(at(.70,.58)>.205,'eastern continental mass');
 assert.ok(at(.65,.76)<=.205,'deep southeast gulf');
 assert.ok(at(.92,.5)<=.205&&at(.65,.95)<=.205,'east and south seas');
 for(const route of a.routes){for(let k=0;k<route.length;k++){const i=route[k];assert.ok(a.land(i));if(k)assert.ok(a.neighbors(i).includes(route[k-1]));}}
 const cached=a.field.slice(),east=a.edgeEast,south=a.edgeSouth;a.edgeEast=null;a.edgeSouth=null;a.derive();assert.deepEqual(a.field,cached,'cached terrain passages preserve exact attraction field');a.edgeEast=east;a.edgeSouth=south;
 const changed=new Landscape({seed:'横陆-002'});assert.notDeepEqual(a.elevation,changed.elevation);
});
test('new ecology conserves all carrier stocks, returns removed plants to remains and evolves over fifty years',()=>{
 const w=new Landscape(),initial=w.history[0];for(let t=0;t<50;t++)w.step();const latest=w.history.at(-1);assert.ok(latest.forest>initial.forest);assert.ok(latest.plant>initial.plant);assert.ok(Math.abs(w.total()-w.initial-w.input+w.escaped)<1e-5);
 for(const k of ['air','ground','qi','soil','detritus','mass'])assert.ok(w[k].every(v=>Number.isFinite(v)&&v>=-1e-10),k);
 const i=Array.from({length:w.n},(_,i)=>i).find(i=>w.land(i)&&w.qi[i*2+1]>0),before=w.total();w.edit(i,'remove');assert.ok(Math.abs(w.total()-before)<1e-8);w.edit(i,'tree');assert.equal(w.qi[i*2+1],0);assert.ok(Math.abs(w.total()-before)<1e-8);
});

test('mountain barriers continuously reduce crossing and blocked qi remains at origin',()=>{
 const open=strip([9,0,0],[0,0,0]),medium=strip([9,0,0],[0,0,0]),strong=strip([9,0,0],[0,0,0]);
 for(const [w,b]of [[open,0],[medium,.4],[strong,1]]){w.mountainBarrier=new Float64Array(3).fill(b);w.transport();}
 assert.ok(open.air[1]>medium.air[1]&&medium.air[1]>strong.air[1]);assert.ok(strong.air[0]>medium.air[0]&&medium.air[0]>open.air[0]);
 assert.ok(strong.blocked[0]>medium.blocked[0]);for(const w of [open,medium,strong])assert.equal(w.air.reduce((a,b)=>a+b,0),9);
 assert.equal(terrainPassage(strong,0,1),terrainPassage(strong,1,0));
 const closed=strip([9,0,0],[0,0,0]);closed.edgeEast=new Float64Array(3);closed.edgeSouth=new Float64Array(3);closed.transport();assert.deepEqual([...closed.air],[9,0,0]);
});
