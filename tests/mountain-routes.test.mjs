import test from 'node:test';import assert from 'node:assert/strict';
import {ORIGIN,LEDGES,WALKABLE,STAIR_LINKS,pathY,moveScene,sceneGround,sceneX,sceneY} from '../sideview/mountain-scene.js';
import {MODES} from '../sideview/world.js';
function person(x,y){return {x:ORIGIN+x,y,vy:0,grounded:true,flying:false,energy:100,mode:'walk'};}
test('every stair joins walkable surfaces and can be climbed in both directions',()=>{
 for(const s of STAIR_LINKS){for(const [x,y] of [s.points[0],s.points.at(-1)])assert.ok(WALKABLE.some(l=>Math.abs((pathY(l,x)??1e9)-y)<1),'stair endpoint supported '+s.id);
 const [x,y]=s.points[0],p=person(x,y),goal=s.points.at(-1);for(let i=0;i<1800&&Math.abs(p.y-goal[1])>1;i++)moveScene(p,{up:true},1/60,MODES.walk);assert.ok(Math.abs(p.y-goal[1])<1,s.id+' reaches upper landing');
 for(let i=0;i<1800&&Math.abs(p.y-y)>1;i++)moveScene(p,{down:true},1/60,MODES.walk);assert.ok(Math.abs(p.y-y)<1,s.id+' returns');}
});
test('bridges connect landings and retain walking support across valleys',()=>{
 for(const l of LEDGES.filter(l=>l.kind==='bridge')){const[a,y]=l.points[0],b=l.points.at(-1)[0],p=person(a+1,pathY(l,a+1));for(let i=0;i<3000&&p.x<ORIGIN+b-1;i++)moveScene(p,{right:true},1/60,MODES.walk);assert.ok(p.x>=ORIGIN+b-1);assert.ok(p.y<sceneGround(p.x)-300,'bridge does not drop traveller to valley');}
});
test('jump and flight share the scene; gravity lands on an upper shelf',()=>{const p=person(sceneX(3300),sceneY(-1600));p.grounded=false;for(let i=0;i<200;i++)moveScene(p,{},1/60,MODES.walk);assert.equal(p.y,sceneY(-1240));moveScene(p,{jump:true},1/60,MODES.walk);assert.ok(p.y<sceneY(-1240));p.mode='sword';moveScene(p,{toggleFlight:true,up:true},1/60,MODES.sword);assert.ok(p.flying&&p.energy<100);});
