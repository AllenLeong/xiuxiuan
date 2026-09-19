import test from 'node:test';import assert from 'node:assert/strict';
import {Terrain,Simulation,TILE,WIDTH,TOP,LOCATIONS,MODES,PLATFORMS,MOUNDS,RAMPS,CAVE_ENTRANCES,upperSurface,isMineable,tileAt,surface,buildings} from '../sideview/world.js';
import {spawn,move,overlaps,relocate} from '../sideview/physics.js';

test('walking uses continuous coordinates and crosses the entire slice without terrain teleportation',()=>{
 const t=new Terrain(),p=spawn(100);let frames=0;for(;frames<85000&&p.x<WIDTH-500;frames++){move(p,t,{right:true},1/60);assert.ok(!overlaps(p,t),'player remains outside rock');}
 assert.ok(p.x>=WIDTH-500,`stuck at ${p.x}`);assert.ok(frames/60/60>15&&frames/60/60<30,'15–30 minute traversal at normal pace');
});

test('mine shaft, deep gallery and cave exit are connected in physical space',()=>{
 const t=new Terrain(),p=spawn(40900);for(let k=0;k<1100;k++)move(p,t,{down:true},1/60);assert.ok(p.y>1400,'can descend into the mine');
 for(let k=0;k<1100;k++)move(p,t,{up:true},1/60);assert.ok(p.y<surface(40900)+TILE,'can climb back to surface');
 const seen=new Set(),queue=[[Math.floor(40900/TILE),22]],goal=[Math.floor(45100/TILE),Math.floor(2820/TILE)];let found=false;
 for(let k=0;k<queue.length&&k<120000;k++){const [x,y]=queue[k],key=x+','+y;if(seen.has(key))continue;seen.add(key);if(x===goal[0]&&y===goal[1]){found=true;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<1670||xx>1930||yy<0||yy>140||t.solid(xx,yy))continue;queue.push([xx,yy]);}}
 assert.ok(found,'deep cavern reachable from shaft through open tiles');
});

test('flight has directional movement, energy use, collision and grounded recovery',()=>{
 const t=new Terrain(),p=spawn(116000);p.mode='sword';p.energy=180;for(let i=0;i<30;i++)move(p,t,{},1/60);const old=p.y;move(p,t,{toggleFlight:true,up:true},1/60);for(let i=0;i<240;i++)move(p,t,{up:true},1/60);assert.ok(p.y<old-1500);assert.ok(p.energy<180);assert.ok(!overlaps(p,t));
 p.energy=.001;move(p,t,{up:true},1/60);assert.equal(p.flying,false);relocate(p,2200);p.energy=5;for(let i=0;i<120;i++)move(p,t,{},1/60);assert.ok(p.energy>5);
});

test('world uses multiple walkable foundations instead of one activity line',()=>{
 const summit=LOCATIONS.find(v=>v.id==='summit'),gate=LOCATIONS.find(v=>v.id==='gate');
 assert.ok(summit.y<-5000&&gate.y<-800,'sect activity occupies several real height bands');
 assert.ok(Math.abs(surface(116000)-surface(2200))<300,'first foundation remains a continuous walkable ground surface');
 assert.ok(PLATFORMS.filter(v=>v.kind==='sect').length>=8,'sect has multiple traversable foundations');
 assert.equal(isMineable(2200,surface(2200)+200),false,'ordinary foundations are not mineable');
 assert.equal(isMineable(44900,2820),true,'known mine caverns remain mineable');
});

test('every mountain stratum can carry terrain, routes, forests or cave entrances',()=>{
 const bases=[-900,-1900,-3000,-4080,-5310];
 for(const base of bases){assert.ok(PLATFORMS.some(v=>v.y===base),'foundation exists at '+base);assert.ok(MOUNDS.some(v=>v.base===base),'mountain grows on foundation '+base);}
 assert.ok(RAMPS.length>=10,'multiple slopes connect foundations as an alternative to ladders');
 assert.ok(new Set(CAVE_ENTRANCES.map(v=>v.layer)).size>=3,'caves can occur on several height layers');
 for(const c of CAVE_ENTRANCES)assert.ok(c.y<0&&Number.isFinite(c.y),'cave entrance is fixed to its layer terrain');
 assert.ok(upperSurface(118200,-5310)<-5700,'the summit foundation has another mountain above it');
});

test('chunk eviction preserves excavations and avoids loading the entire world',()=>{
 const t=new Terrain(),x=200,y=Math.floor(surface(x*TILE)/TILE)+10;t.set(x,y,0);for(let cx=0;cx<250;cx++)t.visible(cx*768,0,cx*768+500,700);assert.ok(t.chunks.size<=64);assert.equal(t.get(x,y),0);assert.equal(new Terrain([...t.edits]).get(x,y),0);
});

test('offscreen economics changes ownership, buildings and surviving ruins from state',()=>{
 const a=new Simulation(),b=new Simulation();b.toggleRoad();a.advance(20);b.advance(20);assert.equal(a.mineOwner,'small');assert.equal(b.mineOwner,'large');assert.equal(b.factions.small.status,'destroyed');assert.ok(b.history.some(e=>e.kind==='conflict'));assert.ok(buildings(b).some(v=>v.id==='small-hall'&&v.ruined));assert.ok(buildings(a).length>buildings(new Simulation()).length);
 assert.ok(b.price>a.price);for(const s of [a,b])assert.ok(Math.abs(s.mineRemaining+s.mineStock+s.cityStock+s.ore+s.consumed-6065)<1e-6,'resource transfers and consumption balance');
 const before=a.mineRemaining;assert.equal(a.extract(),true);assert.equal(a.mineRemaining,before-1);assert.equal(a.ore,1);const count=buildings(b).length;const restored=new Simulation(JSON.parse(JSON.stringify(b)));assert.equal(buildings(restored).length,count);
});
