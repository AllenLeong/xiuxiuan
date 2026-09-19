import {ORIGIN,LEDGES,WALKABLE,pathY,SCENE_CAVES,sceneGround,sceneX,sceneY} from './mountain-scene.js';
import {hash} from './world.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ready=im=>im?.complete&&im.naturalWidth;
export function loadMountainArt(){const art={};for(const [id,file] of Object.entries({cliff:'cliff-atlas-v1.png',buildings:'building-atlas-v1.png',distance:'mountain-distance-v1.png',foreground:'foreground-atlas-v1.png',rock:'rock-detail-v1.png'})){const im=new Image();im.src='/sideview/assets/'+file;art[id]=im;}return art;}
function sprite(g,im,rect,x,y,w,h){if(ready(im))g.drawImage(im,...rect,x,y,w,h);}
const CLIFFS=[[0,0,620,1024],[625,0,435,1024],[1062,0,474,1024]];
const HOUSES=[[42,64,693,422],[818,0,702,489],[15,502,815,486],[950,494,450,517]];
function strokePath(g,l,offset=0){g.beginPath();l.points.forEach(([x,y],i)=>{if(i)g.lineTo(ORIGIN+x,y+offset);else g.moveTo(ORIGIN+x,y+offset);});}
function cloud(g,x,y,w,h,opacity){g.save();const mist=g.createRadialGradient(x,y,0,x,y,w);mist.addColorStop(0,`rgba(235,248,241,${opacity})`);mist.addColorStop(.52,`rgba(226,244,238,${opacity*.55})`);mist.addColorStop(1,'rgba(231,245,239,0)');g.translate(x,y);g.scale(1,h/w);g.fillStyle=mist;g.translate(-x,-y);g.fillRect(x-w,y-w,w*2,w*2);g.restore();}
export function drawMountainArt(renderer,terrain,p,sim,structures,time){
 const g=renderer.ctx,w=renderer.w,h=renderer.h,art=renderer.art;
 const z=renderer.overview?Math.min(w/13900,h/6500):.8;renderer.zoom=z;
 renderer.camera=renderer.overview?{x:ORIGIN-650-(w/z-13900)/2,y:-5700}:{x:p.x-w/z*.44,y:p.y-h/z*.65};
 const cam=renderer.camera,left=cam.x-250,right=cam.x+w/z+250,bottom=cam.y+h/z+300;
 g.setTransform(renderer.dpr,0,0,renderer.dpr,0,0);g.fillStyle='#b5cdd2';g.fillRect(0,0,w,h);
 if(ready(art.distance)){const dh=h*1.22,dw=Math.max(w*1.18,dh*art.distance.naturalWidth/art.distance.naturalHeight),offset=clamp((p.x-ORIGIN)/14000);g.drawImage(art.distance,-(dw-w)*offset,-h*.10+clamp(-p.y/6000)*h*.08,dw,dh);}
 g.fillStyle='#bdd8d922';g.fillRect(0,0,w,h);
 g.save();g.scale(z,z);g.translate(-cam.x,-cam.y);
 const lands=LEDGES.filter(l=>l.kind==='land').sort((a,b)=>Math.min(...a.points.map(p=>p[1]))-Math.min(...b.points.map(p=>p[1])));
 // Rock roots continue below the foreground valley. Each image's ledge is
 // registered to the same path data that controls standing and locomotion.
 for(let i=0;i<lands.length;i++){
  const l=lands[i],x1=ORIGIN+l.points[0][0],x2=ORIGIN+l.points.at(-1)[0];if(x2+900<left||x1-900>right)continue;
  const top=Math.min(...l.points.map(v=>v[1])),foot=sceneGround((x1+x2)/2)+160,rect=CLIFFS[i%3],shelf=.184,dh=(foot-top)/(1-shelf),dw=x2-x1+460;
  if(ready(art.cliff)){sprite(g,art.cliff,rect,x1-230,top-dh*shelf,dw,dh);if(ready(art.rock)){const detail=cliffDetail(renderer,rect);g.globalAlpha=renderer.overview?.27:.68;g.drawImage(detail,x1-230,top-dh*shelf,dw,dh);g.globalAlpha=1;}}
  else{g.fillStyle='#587367';g.fillRect(x1,top,x2-x1,foot-top);}
 }
 // Real foreground valley, textured from the rock atlas instead of a blank slab.
 const floor=new Path2D();floor.moveTo(left,bottom);for(let x=left;x<=right+100;x+=80)floor.lineTo(x,sceneGround(x)+12);floor.lineTo(right+100,bottom);floor.closePath();g.save();g.clip(floor);g.fillStyle='#324e3a';g.fillRect(left,cam.y,right-left,bottom-cam.y);if(ready(art.cliff)){for(let x=Math.floor(left/650)*650;x<right;x+=650)sprite(g,art.cliff,[30,740,550,270],x,sceneGround(x),650,390);}g.restore();
 // Individual stone treads and timber planks make the traversable edge legible.
 for(const l of LEDGES){if(l.points.at(-1)[0]+ORIGIN<left||l.points[0][0]+ORIGIN>right)continue;
  strokePath(g,l,8);g.strokeStyle=l.kind==='land'||l.kind==='ground'?'#4b663d':'#314736';g.lineWidth=l.kind==='bridge'?23:36;g.stroke();
  strokePath(g,l);g.strokeStyle=l.kind==='bridge'?'#b5a27a':'#b6b29a';g.lineWidth=l.kind==='land'?12:9;g.stroke();
  for(let i=1;i<l.points.length;i++){const[a,ay]=l.points[i-1],[b,by]=l.points[i],length=Math.hypot(b-a,by-ay),n=Math.ceil(length/(l.kind==='stairs'?27:l.kind==='bridge'?32:48));
   for(let k=0;k<n;k++){const t=k/n,x=ORIGIN+a+(b-a)*t,y=ay+(by-ay)*t;if(x<left||x>right)continue;
    if(l.kind==='land'||l.kind==='ground'){g.fillStyle=hash(k,a)>.5?'#a4ac88':'#d0c7a6';g.fillRect(x-8,y-3,17,4);continue;}
    g.strokeStyle=k%2?'#cab98e':'#a7926a';g.lineWidth=4;g.beginPath();g.moveTo(x-16,y);g.lineTo(x+16,y);g.stroke();
    if(l.kind==='bridge'&&k%3===0){g.strokeStyle='#625e44';g.lineWidth=5;g.beginPath();g.moveTo(x,y+10);g.lineTo(x,y-52);g.stroke();}}
   if(l.kind==='bridge'){g.strokeStyle='#b7a983';g.lineWidth=3;g.beginPath();g.moveTo(ORIGIN+a,ay-50);g.lineTo(ORIGIN+b,by-50);g.stroke();}}
 }
 // Streams remain world-anchored; white streaks animate only within each fall.
 for(const [lx,y0,y1] of [[1750,-2100,-560],[4100,-2800,-1250],[6100,-850,400]]){
  const x=ORIGIN+sceneX(lx),y=sceneY(y0),end=sceneY(y1);if(x<left-150||x>right+150)continue;
  const gradient=g.createLinearGradient(x-20,0,x+50,0);gradient.addColorStop(0,'#a7e8e500');gradient.addColorStop(.4,'#d0f3ecb0');gradient.addColorStop(.65,'#eafff4c0');gradient.addColorStop(1,'#98d5dc00');g.fillStyle=gradient;g.fillRect(x-20,y,70,end-y);
  g.strokeStyle='#f0fffbb0';g.lineWidth=2;for(let k=0;k<8;k++){const yy=y+((time*160+k*277)%(end-y));g.beginPath();g.moveTo(x+k*4-5,yy);g.lineTo(x+k*4-7,Math.min(end,yy+100));g.stroke();}cloud(g,x,end,190,44,.38);
 }
 // A grove has clumps and clearings; entrances and standing areas remain open.
 for(const l of WALKABLE){if(l.kind==='bridge')continue;const lo=Math.max(l.points[0][0],left-ORIGIN),hi=Math.min(l.points.at(-1)[0],right-ORIGIN);
  for(let x=Math.ceil(lo/155)*155;x<hi;x+=155){const wx=ORIGIN+x,y=pathY(l,x);if(hash(x,l.id.length)>.72||structures.some(b=>Math.abs(b.x-wx)<b.width*.8+70&&Math.abs(b.y-y)<150)||SCENE_CAVES.some(c=>Math.abs(c.x-wx)<130&&Math.abs(c.y-y)<100))continue;
   const tw=120+hash(x,8)*140,th=tw*1.7,sw=renderer.trees.naturalWidth/4,sh=renderer.trees.naturalHeight/2;if(ready(renderer.trees))g.drawImage(renderer.trees,0,0,sw,sh,wx-tw/2,y-th,tw,th);
   if(ready(art.foreground)&&hash(x,4)>.55)sprite(g,art.foreground,[0,550,768,474],wx-90,y-85,180,90);}
 }
 let count=0;
 for(const b of structures){if(b.x+b.width<left||b.x-b.width>right||b.y<cam.y-400||b.y>bottom)continue;
  if(!ready(art.buildings)||b.ruined){renderer.building(b,p.inside===b.id);count++;continue;}
  const slot=b.type==='gate'?1:b.type==='hall'?(b.id==='sword-pavilion'||b.id==='dan-pavilion'?3:2):0,rect=HOUSES[slot],bw=b.width*(slot===3?1.6:2.05),bh=bw*rect[3]/rect[2];
  sprite(g,art.buildings,rect,b.x-bw/2,b.y-bh+3,bw,bh);
  if(Math.abs(p.x-b.x)<100&&Math.abs(p.y-b.y)<100){g.fillStyle='#f5e6bd';g.font='15px serif';g.textAlign='center';g.fillText(b.name,b.x,b.y-bh-18);}count++;
 }
 for(const c of SCENE_CAVES){if(c.x<left-100||c.x>right+100)continue;g.save();g.translate(c.x,c.y);g.fillStyle='#253931';g.strokeStyle='#8e9980';g.lineWidth=14;g.beginPath();g.moveTo(-55,0);g.lineTo(-52,-58);g.bezierCurveTo(-39,-128,37,-128,51,-60);g.lineTo(57,0);g.closePath();g.fill();g.stroke();const shadow=g.createRadialGradient(0,-35,2,0,-35,85);shadow.addColorStop(0,'#07191e');shadow.addColorStop(1,'#263e32');g.fillStyle=shadow;g.fill();g.restore();}
 for(const l of lands){const x=ORIGIN+l.points[1][0]+160,y=pathY(l,x-ORIGIN);if(x>left&&x<right)renderer.person(x,y,'#b4aba0',false);}
 renderer.person(p.x,p.y,p.flying?'#d4f1e6':'#fff2cb',true,p.facing);
 if(renderer.overview){g.strokeStyle='#ffe6ae';g.lineWidth=1.5/z;g.beginPath();g.arc(p.x,p.y-20,7/z,0,Math.PI*2);g.stroke();}
 if(p.flying){g.strokeStyle='#c3f1ed';g.lineWidth=4;g.beginPath();g.moveTo(p.x-30,p.y+3);g.lineTo(p.x+30,p.y+3);g.stroke();}g.restore();
 drawForeground(renderer,p,structures,time);
 if(p.cave)renderer.caveInterior(p);renderer.last={chunks:0,cached:terrain.chunks.size,entities:count};renderer.frame++;
}
export function foregroundHabitat(p){return p.flying&&p.y< -1800||p.y< -3600?'cloud':p.y< -1500?'cliff':'forest';}
function drawForeground(r,p,structures,time){
 if(r.overview)return;const g=r.ctx,w=r.w,h=r.h,art=r.art,habitat=foregroundHabitat(p),cam=r.camera;
 g.save();g.setTransform(r.dpr,0,0,r.dpr,0,0);
 // Near-camera framing is confined to the lower edge, independent of midground
 // walking height. Camera travel drives parallax; it cannot cover a central door.
 g.beginPath();g.rect(0,h*.78,w,h*.22);g.clip();
 if(habitat==='cloud'){
  if(ready(art.cliff)){const phase=((cam.x*.22)%(w*2)+w*2)%(w*2),xx=w*1.5-phase;g.globalAlpha=.42;sprite(g,art.cliff,CLIFFS[2],xx,h*.86,w*.22,h*.65);g.globalAlpha=1;}
  for(let k=0;k<5;k++){const x=((k*421-cam.x*.25+time*(9+k))%(w+600)+w+600)%(w+600)-300;cloud(g,x,h*(.99+(k%2)*.06),300+k*40,48+k*10,.3);}
 }else if(ready(art.foreground)){
  const spacing=habitat==='cliff'?340:380,phase=((cam.x*.22)%spacing+spacing)%spacing;
  for(let k=-1;k<w/spacing+2;k++){const sx=k*spacing-phase,sw=habitat==='cliff'?300:390,sh=sw*.60,sy=h+sh*.46+Math.sin(k*4)*14;g.globalAlpha=habitat==='cliff'?.78:.86;sprite(g,art.foreground,habitat==='cliff'?[790,557,745,461]:[0,557,770,461],sx,sy-sh,sw,sh);}
 }
 g.restore();
}
const detailCache=new Map();
function cliffDetail(renderer,rect){const key=rect.join(',');if(detailCache.has(key))return detailCache.get(key);const c=document.createElement('canvas');c.width=1024;c.height=2048;const g=c.getContext('2d');g.drawImage(renderer.art.cliff,...rect,0,0,c.width,c.height);g.globalCompositeOperation='source-in';const pattern=g.createPattern(renderer.art.rock,'repeat');pattern.setTransform(new DOMMatrix().scale(.38));g.fillStyle=pattern;g.fillRect(0,0,c.width,c.height);detailCache.set(key,c);return c;}
