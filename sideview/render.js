import {loadMountainArt,drawMountainArt} from './mountain-art.js';
import {ORIGIN,LEDGES,WALKABLE,pathY,SCENE_CAVES,sceneGround} from './mountain-scene.js';
import {mountainZone,routeHeight,ROUTE_JUNCTIONS} from './mountain.js';
import {TILE,CHUNK,WIDTH,TOP,surface,hash,LOCATIONS,LADDERS,PLATFORMS,RAMPS,CAVE_ENTRANCES,upperSurface,mountainSurface,bridgeY} from './world.js';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera={x:0,y:0};this.zoom=.82;this.trees=new Image();this.trees.src='/feasibility/assets/vegetation-atlas.png';this.frame=0;this.overview=false;this.art=loadMountainArt();}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}this.w=r.width;this.h=r.height;this.dpr=d;}
 draw(terrain,p,sim,structures,time){this.resize();if(mountainZone(p.x)){this.drawMountain(terrain,p,sim,structures,time);return;}const g=this.ctx,w=this.w,h=this.h;this.zoom=p.x>11000&&p.x<17500?.55:p.x>27000&&p.x<44500?.42:p.x>94000&&p.x<135000?.34:.82;const z=this.zoom;this.camera.x=p.x-w/z*.42;this.camera.y=p.y-h/z*.60;const cam=this.camera;g.setTransform(this.dpr,0,0,this.dpr,0,0);
 const underground=p.y>surface(p.x)+100,high=clamp(-p.y/5200),sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,underground?'#111b22':high>.5?'#344568':'#637f90');sky.addColorStop(1,underground?'#24383b':high>.5?'#98b4c2':'#d5d6b7');g.fillStyle=sky;g.fillRect(0,0,w,h);
 if(!underground){this.background(p,time);this.rangeVista(p);}
 g.save();g.scale(z,z);g.translate(-cam.x,-cam.y);
 const left=cam.x-50,top=cam.y-70,right=cam.x+w/z+50,bottom=cam.y+h/z+60;
 // Fill from the actual mountain skyline all the way down to its foot.
 // Paths in front remain traversable; they express depth around the same mass.
 if(!underground){
  const rock=g.createLinearGradient(0,top,0,bottom);rock.addColorStop(0,'#63776c');rock.addColorStop(1,'#364f49');
  g.fillStyle=rock;g.beginPath();g.moveTo(left,bottom+100);
  for(let x=left;x<=right+48;x+=48)g.lineTo(x,mountainSurface(x));
  g.lineTo(right+48,bottom+100);g.closePath();g.fill();
  g.strokeStyle='#abb29a24';g.lineWidth=3;
  for(let x=Math.floor(left/230)*230;x<right;x+=230){const roof=mountainSurface(x),foot=surface(x);if(foot-roof<250)continue;g.beginPath();g.moveTo(x,roof+45);g.bezierCurveTo(x-65,roof+(foot-roof)*.3,x+110,roof+(foot-roof)*.7,x+35,Math.min(bottom,foot));g.stroke();}
 }
 // Background canopy is seeded by world coordinate; it never respawns on camera moves.
 if(!underground)for(let index=Math.floor(left/120);index<right/120+1;index++){const x=index*120+hash(index)*70,y=surface(x),wet=x>57000&&x<88000,wooded=(x>27000&&x<44500)||(x>94000&&x<135000);const nearTown=LOCATIONS.some(l=>!['forest','path'].includes(l.kind)&&Math.abs(x-l.x)<320);if(nearTown||hash(index,1)>(wet?.91:wooded?.84:.48))continue;const a=58+hash(index,2)*65,b=a*1.6,slot=wooded?(hash(index,3)>.78?2:0):x>60000&&x<90000?4:hash(index,3)>.7?3:0;
  if(this.trees.complete&&this.trees.naturalWidth){const sw=this.trees.naturalWidth/4,sh=this.trees.naturalHeight/2;g.globalAlpha=.85;g.drawImage(this.trees,slot%4*sw,Math.floor(slot/4)*sh,sw,sh,x-a/2,y-b+10,a,b);g.globalAlpha=1;}else{g.fillStyle='#45674e';g.beginPath();g.ellipse(x,y-40,25,52,0,0,Math.PI*2);g.fill();}}
 // Every stratum can carry a forest of its own. These trees follow the local
 // hills on that foundation and remain stable in world coordinates.
 if(!underground&&this.trees.complete&&this.trees.naturalWidth)for(const q of PLATFORMS){if(q.kind!=='sect'||q.x2<left||q.x1>right)continue;for(let i=Math.floor(Math.max(q.x1,left)/180);i<=Math.ceil(Math.min(q.x2,right)/180);i++){if(hash(i,Math.round(q.y))>.58)continue;const x=i*180+hash(i,7)*70,y=upperSurface(x,q.y),a=45+hash(i,8)*45,b=a*1.7,slot=q.y<-3500?2:hash(i,9)>.78?5:0,sw=this.trees.naturalWidth/4,sh=this.trees.naturalHeight/2;g.globalAlpha=.78;g.drawImage(this.trees,slot%4*sw,Math.floor(slot/4)*sh,sw,sh,x-a/2,y-b+8,a,b);g.globalAlpha=1;}}
 const chunks=terrain.visible(left,top,right,bottom);
 for(const c of chunks)for(let ly=0;ly<CHUNK;ly++)for(let lx=0;lx<CHUNK;lx++){
  const t=c.tiles[ly*CHUNK+lx];if(!t)continue;const tx=c.cx*CHUNK+lx,ty=c.cy*CHUNK+ly,x=tx*TILE,y=ty*TILE;if(x<left-TILE||x>right||y<top-TILE||y>bottom)continue;
  // Render the route once below, not every one-way collision row as a shelf.
  if(t===4)continue;
  const f=hash(tx,ty),cold=surface(x)<-1400;g.fillStyle=t===4?(f>.5?'#777665':'#858170'):t===6?'#458c9b99':t===3?'#4f6768':t===1?(cold?'#b2c7c7':f>.5?'#81795a':'#8a805e'):(f>.5?'#384950':'#3d4e54');g.fillRect(x,y,TILE+.4,TILE+.4);
  if(t===3){g.fillStyle='#a5d8c2';g.beginPath();g.moveTo(x+6,y+16);g.lineTo(x+11,y+5);g.lineTo(x+17,y+14);g.lineTo(x+12,y+19);g.closePath();g.fill();}
  if(t!==6&&!terrain.solid(tx,ty-1)){g.fillStyle=t===4?'#d1c49a':y>surface(x)+100?'#778b83':cold?'#e0e9df':'#6e9566';g.fillRect(x,y,TILE,4);}
  if(t===2&&f>.8){g.strokeStyle='#a7b7af18';g.lineWidth=1;g.beginPath();g.moveTo(x+2,y+8);g.lineTo(x+12,y+13);g.lineTo(x+20,y+6);g.stroke();}
 }
 // Narrow earth paths contour the exposed face; rock continues below and behind.
 for(const q of PLATFORMS)if(q.x2>left&&q.x1<right){const a=Math.max(q.x1,left),b=Math.min(q.x2,right);g.lineJoin='round';g.strokeStyle='#73815d';g.lineWidth=24;g.beginPath();for(let x=a;x<=b;x+=24){const y=upperSurface(x,q.y)+8;if(x===a)g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();g.strokeStyle='#b8ad84';g.lineWidth=5;g.stroke();}
 for(const r of RAMPS)if(Math.max(r.x1,r.x2)>left&&Math.min(r.x1,r.x2)<right){g.strokeStyle='#788367';g.lineWidth=20;g.beginPath();g.moveTo(r.x1,r.y1);g.lineTo(r.x2,r.y2);g.stroke();g.strokeStyle='#c0b58d';g.lineWidth=4;g.stroke();}
 // Rope ladders form actual traversal routes through the generated cave openings.
 for(const l of LADDERS)if(l.x>left-80&&l.x<right+80){g.strokeStyle='#aa9876';g.lineWidth=3;g.beginPath();g.moveTo(l.x-16,l.top);g.lineTo(l.x-16,l.bottom);g.moveTo(l.x+16,l.top);g.lineTo(l.x+16,l.bottom);for(let y=Math.max(l.top,Math.floor(top/22)*22);y<Math.min(l.bottom,bottom);y+=22){g.moveTo(l.x-16,y);g.lineTo(l.x+16,y);}g.stroke();}
 if(right>50300&&left<53700){g.strokeStyle='#746954';g.lineWidth=5;g.beginPath();for(let x=Math.max(50300,left);x<=Math.min(53700,right);x+=12){const y=bridgeY(x)-26;if(x===Math.max(50300,left))g.moveTo(x,y);else g.lineTo(x,y);}g.stroke();for(let x=Math.ceil(Math.max(50300,left)/120)*120;x<Math.min(53700,right);x+=120){g.beginPath();g.moveTo(x,bridgeY(x)-26);g.lineTo(x,bridgeY(x));g.stroke();}}
 let loadedEntities=0;for(const b of structures){if(b.x+b.width<left||b.x-b.width>right||b.y<top-300||b.y-b.height>bottom+200)continue;this.building(b,p.inside===b.id);loadedEntities++;}
 // Local NPC projections use persistent population, ownership and displacement state.
 for(const loc of LOCATIONS.filter(l=>['village','city','sect'].includes(l.kind))){if(Math.abs(loc.x-p.x)>1800)continue;const owner=loc.id==='gate'?'large':loc.id,f=sim.factions[owner];if(!f||f.status==='destroyed')continue;const count=Math.min(8,Math.ceil(f.people/25));for(let k=0;k<count;k++){const x=loc.x-180+k*80+Math.sin(time*.12+k)*25,y=loc.y??surface(x);this.person(x,y-3,k%2?'#c2ac7c':'#809c94',false);loadedEntities++;}}
 if(Math.abs(p.x-14000)<1800)for(let k=0;k<Math.min(10,sim.refugees);k++)this.person(12800+k*36,surface(12800+k*36),'#a98270',false);
 // The trade ledger has a visible counterpart. Closing the road removes these
 // caravans; later stock, price and faction changes still follow month by month.
 if(sim.roadOpen){const route=26700,caravanX=40700-(time*32%route);if(caravanX>left-200&&caravanX<right+200){this.caravan(caravanX,surface(caravanX));loadedEntities+=4;}}
 // Mining camp flag follows the simulation even when the mine was never loaded.
 if(Math.abs(p.x-40700)<1500){const x=40815,y=surface(x)-110;g.strokeStyle='#c2b088';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+110);g.stroke();g.fillStyle=sim.mineOwner==='small'?'#85aa93':'#ba9b61';g.fillRect(x,y,48,25);g.fillStyle='#213330';g.font='13px serif';g.fillText(sim.mineOwner==='small'?'松':'玄',x+16,y+17);}
 this.person(p.x,p.y,p.flying?'#c9eadc':'#dde1c5',true,p.facing);
 for(const c of CAVE_ENTRANCES)if(c.x>left-100&&c.x<right+100&&c.y>top-150&&c.y<bottom+100){g.fillStyle='#101b20';g.strokeStyle='#8e927d';g.lineWidth=4;g.beginPath();g.arc(c.x,c.y-42,35,Math.PI,0);g.lineTo(c.x+35,c.y);g.lineTo(c.x-35,c.y);g.closePath();g.fill();g.stroke();g.fillStyle='#d6c697';g.font='12px serif';g.textAlign='center';g.fillText(c.name,c.x,c.y-92);}
 this.person(p.x,p.y,p.flying?'#c9eadc':'#dde1c5',true,p.facing);
 if(p.flying){g.strokeStyle='#a9e6dd';g.lineWidth=3;g.beginPath();g.moveTo(p.x-24,p.y+4);g.lineTo(p.x+29,p.y+4);g.stroke();g.strokeStyle='#a9e6dd55';g.beginPath();g.moveTo(p.x-p.facing*22,p.y+5);g.lineTo(p.x-p.facing*80,p.y+14);g.stroke();}
 for(const l of LOCATIONS){if(Math.abs(l.x-p.x)>1200)continue;const ly=l.y??surface(l.x);if(Math.abs(ly-p.y)>900)continue;g.font='18px "Songti SC",serif';g.textAlign='center';g.fillStyle='#eee5c4';g.shadowColor='#182b31';g.shadowBlur=5;g.fillText(l.name,l.x,ly-210);g.shadowBlur=0;}
 g.restore();
 if(underground){const light=g.createRadialGradient(w*.42,h*.60,55,w*.42,h*.6,Math.max(w,h)*.75);light.addColorStop(0,'#06121700');light.addColorStop(.7,'#07121980');light.addColorStop(1,'#040b11e0');g.fillStyle=light;g.fillRect(0,0,w,h);}
 if(p.y< -1500&&!underground){g.fillStyle='#eef4ee20';for(let k=0;k<5;k++){const x=((time*6+k*269)% (w+350))-150,y=h*.8+Math.sin(k)*40;g.beginPath();g.ellipse(x,y,210,28,0,0,Math.PI*2);g.fill();}}
 if(p.cave)this.caveInterior(p);this.last={chunks:chunks.length,cached:terrain.chunks.size,entities:loadedEntities};this.frame++;
 }
 drawMountain(terrain,p,sim,structures,time){drawMountainArt(this,terrain,p,sim,structures,time);}
 rangeVista(p){const g=this.ctx,w=this.w,h=this.h;let strength=0,major=false;if(p.x>25000&&p.x<45000)strength=clamp(1-Math.abs(p.x-35000)/11000);if(p.x>90000&&p.x<138000){strength=clamp(1-Math.abs(p.x-115000)/25000);major=true;}if(strength<=0)return;const base=h*.92,peak=major?h*.09:h*.28,center=major?w*.58:w*.5;g.save();g.globalAlpha=.16+.28*strength;for(let layer=0;layer<4;layer++){const spread=w*(.72-layer*.11),lift=layer*38;g.fillStyle=['#284e50','#315d58','#416b5e','#5f8069'][layer];g.beginPath();g.moveTo(center-spread,base);g.lineTo(center-spread*.72,base-80-lift);g.lineTo(center-spread*.48,base-50-lift);g.lineTo(center-spread*.28,peak+150-layer*28);g.lineTo(center-spread*.12,peak+210-layer*18);g.lineTo(center,peak-layer*10);g.lineTo(center+spread*.14,peak+180-layer*16);g.lineTo(center+spread*.34,peak+100-layer*22);g.lineTo(center+spread*.52,base-100-lift);g.lineTo(center+spread,base);g.closePath();g.fill();}g.strokeStyle='#d9e1c52d';g.lineWidth=2;for(let k=0;k<5;k++){g.beginPath();g.moveTo(0,base-k*55);g.quadraticCurveTo(w*.5,base-k*55-35,w,base-k*55+8);g.stroke();}g.restore();}
 background(p,time){const g=this.ctx,w=this.w,h=this.h;g.fillStyle='#f3e9c08c';g.beginPath();g.arc(w*.79,h*.19,24,0,Math.PI*2);g.fill();
 for(let layer=0;layer<3;layer++){const par=.035+layer*.025,base=h*(.60+layer*.1),amp=55+layer*25;g.fillStyle=['#819b9a66','#68878177','#496f6b80'][layer];g.beginPath();g.moveTo(0,h);for(let x=-30;x<w+40;x+=16){const world=p.x*par+x;const y=base-Math.abs(Math.sin(world*.004+layer))*amp-Math.sin(world*.012+layer)*amp*.2;g.lineTo(x,y);}g.lineTo(w,h);g.closePath();g.fill();}
 }
 building(b,inside){const g=this.ctx,x=b.x,y=b.y,w=b.width,h=b.height,left=x-w/2;g.save();g.globalAlpha=b.ruined?.7:1;g.fillStyle=b.ruined?'#5d625b':'#d0c3a0';g.strokeStyle='#3c4943';g.lineWidth=3;
 if(b.type==='garden'){g.fillStyle='#687f53';g.fillRect(left,y-8,w,12);for(let n=0;n<12;n++){g.fillStyle=n%2?'#baa0bd':'#77ad9c';g.beginPath();g.ellipse(left+n*w/12,y-20,7,13,0,0,Math.PI*2);g.fill();}g.restore();return;}
 if(b.type==='gate'){for(const s of [-1,1]){g.fillStyle='#a5a58a';g.fillRect(x+s*w*.34-10,y-h,20,h);g.strokeRect(x+s*w*.34-10,y-h,20,h);}g.fillStyle='#596e63';g.fillRect(left,y-h+20,w,18);}else{const wallHeight=b.ruined?h*.45:h;g.fillRect(left,y-wallHeight,w,wallHeight);g.strokeRect(left,y-wallHeight,w,wallHeight);}
 if(!b.ruined){g.fillStyle=inside?'#253a3a':'#536f64';g.beginPath();g.moveTo(left-18,y-h+10);g.quadraticCurveTo(x-w*.15,y-h-15,x,y-h-28);g.quadraticCurveTo(x+w*.15,y-h-15,x+w/2+18,y-h+10);g.lineTo(left-18,y-h+10);g.fill();g.stroke();}
 else{g.strokeStyle='#b6ac8b';for(let k=0;k<5;k++){g.beginPath();g.moveTo(left+k*w/5,y-15);g.lineTo(left+k*w/5+10,y-30-hash(k)*40);g.stroke();}}
 if(b.type!=='gate'){g.fillStyle='#283f3e';g.fillRect(x-16,y-48,32,48);for(const side of [-1,1]){g.fillStyle='#d8bf78';g.fillRect(x+side*w*.3-12,y-h*.63,24,25);g.strokeRect(x+side*w*.3-12,y-h*.63,24,25);}if(inside){g.fillStyle='#293c3df0';g.fillRect(left+5,y-h+15,w-10,h-20);g.fillStyle='#a78f63';g.fillRect(left+18,y-25,45,10);g.fillRect(x+20,y-42,35,6);g.fillStyle='#f1d7a0';g.fillRect(x+30,y-64,5,20);}}
 g.fillStyle=b.ruined?'#b4b2a0':'#f4dfb4';g.font='13px "Songti SC",serif';g.textAlign='center';g.fillText(b.ruined?b.name+' · 遗址':b.name,x,y-h-42);g.restore();
 }
 person(x,y,color,player,facing=1){const g=this.ctx;g.save();g.translate(x,y);g.fillStyle='#14282c';g.beginPath();g.ellipse(0,2,player?13:9,3,0,0,Math.PI*2);g.fill();g.fillStyle=color;g.beginPath();g.moveTo(-5,-29);g.lineTo(6,-29);g.lineTo(10,0);g.lineTo(-10,0);g.closePath();g.fill();g.fillStyle='#e0c7ab';g.beginPath();g.arc(0,-35,6,0,Math.PI*2);g.fill();g.fillStyle='#243a3c';g.fillRect(-6,-41,12,4);g.strokeStyle='#274d4b';g.lineWidth=3;g.beginPath();g.moveTo(-3,-20);g.lineTo(-3,0);g.moveTo(4,-20);g.lineTo(5,0);g.stroke();if(player){g.strokeStyle='#eadca8';g.lineWidth=2;g.beginPath();g.moveTo(-facing*8,-36);g.lineTo(-facing*14,-8);g.stroke();}g.restore();}
 caravan(x,y){const g=this.ctx;g.save();g.translate(x,y);g.fillStyle='#705f48';g.fillRect(-42,-30,65,22);g.fillStyle='#a48a61';g.beginPath();g.arc(-27,-5,10,0,Math.PI*2);g.arc(10,-5,10,0,Math.PI*2);g.fill();g.strokeStyle='#4d4134';g.lineWidth=3;g.beginPath();g.moveTo(23,-15);g.lineTo(52,-20);g.stroke();g.fillStyle='#8c7657';g.beginPath();g.ellipse(62,-20,19,10,0,0,Math.PI*2);g.fill();g.fillRect(71,-20,4,22);g.fillStyle='#d1bd87';g.font='11px serif';g.textAlign='center';g.fillText('矿',-10,-14);g.restore();}
 caveInterior(p){const g=this.ctx,w=this.w,h=this.h,c=CAVE_ENTRANCES.find(v=>v.id===p.cave);g.setTransform(this.dpr,0,0,this.dpr,0,0);const grad=g.createRadialGradient(w*.5,h*.55,40,w*.5,h*.55,w*.75);grad.addColorStop(0,'#344442');grad.addColorStop(.48,'#1e3032');grad.addColorStop(1,'#081317');g.fillStyle=grad;g.fillRect(0,0,w,h);g.fillStyle='#334547';for(let x=-80;x<w+100;x+=90){const n=hash(Math.floor(x/30),c?.id.length||1);g.beginPath();g.moveTo(x,0);g.lineTo(x+28+n*45,70+n*95);g.lineTo(x+75,0);g.fill();}g.fillStyle='#24383a';g.beginPath();g.moveTo(0,h*.78);for(let x=0;x<=w;x+=55)g.lineTo(x,h*.70+Math.sin(x*.018)*25+hash(x,3)*35);g.lineTo(w,h);g.lineTo(0,h);g.fill();g.strokeStyle='#6d8580';g.lineWidth=3;for(let k=0;k<3;k++){const y=h*(.34+k*.15);g.beginPath();g.moveTo(w*.08,y);g.quadraticCurveTo(w*.5,y-50+(p.caveX||0)*.04,w*.92,y+15);g.stroke();}g.fillStyle='#9ad7c4';for(let k=0;k<14;k++){const x=(k*173-(p.caveX||0)*.25)%(w+80),y=h*.68+Math.sin(k)*35;g.beginPath();g.moveTo(x,y);g.lineTo(x+7,y-22-hash(k)*22);g.lineTo(x+14,y);g.fill();}this.person(w*.5,h*.69,'#dde1c5',true,p.facing);}
}
