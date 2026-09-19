import {precipitation} from './ecology.js';
// A separate, rectangular feasibility kernel. All qi pools share one ledger.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const hash=(x,y,s)=>{let h=Math.imul(x+374761393,668265263)^Math.imul(y+1274126177,1597334677)^s;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;};
const seedOf=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const noise=(x,y,s)=>{const a=Math.floor(x),b=Math.floor(y),tx=x-a,ty=y-b,u=tx*tx*(3-2*tx),v=ty*ty*(3-2*ty);return (hash(a,b,s)*(1-u)+hash(a+1,b,s)*u)*(1-v)+(hash(a,b+1,s)*(1-u)+hash(a+1,b+1,s)*u)*v;};
const gauss=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
function roundedCoast(points){const out=[],n=points.length;for(let i=0;i<n;i++){
 const a=points[(i+n-1)%n],b=points[i],c=points[(i+1)%n],d=points[(i+2)%n];
 for(let j=0;j<6;j++){const t=j/6,t2=t*t,t3=t2*t;out.push([0,1].map(k=>.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));}
 }return out;}
function coastDistance(x,y,edges){let inside=false,d=.11*.11;for(const e of edges){
 if((e.ay>y)!==(e.by>y)&&x<e.dx*(y-e.ay)/e.dy+e.ax)inside=!inside;
 // Only the near shore affects elevation. Far sea is already at zero depth.
 if(x<e.minX-.11||x>e.maxX+.11||y<e.minY-.11||y>e.maxY+.11)continue;
 const t=clamp(((x-e.ax)*e.dx+(y-e.ay)*e.dy)/e.len),a=x-e.ax-t*e.dx,b=y-e.ay-t*e.dy;d=Math.min(d,a*a+b*b);
 }return (inside?1:-1)*Math.sqrt(d);}
class Heap{constructor(value){this.items=[];this.value=value;}push(i){const a=this.items;let p=a.length;a.push(i);while(p){const j=(p-1)>>1;if(this.value[a[j]]<=this.value[i])break;a[p]=a[j];p=j;}a[p]=i;}pop(){const a=this.items,r=a[0],last=a.pop();if(a.length){let p=0;while(p*2+1<a.length){let j=p*2+1;if(j+1<a.length&&this.value[a[j+1]]<this.value[a[j]])j++;if(this.value[last]<=this.value[a[j]])break;a[p]=a[j];p=j;}a[p]=last;}return r;}}
export const PLANTS=[
 {name:'旱原草',layer:0,temp:25,tol:30,water:.25,wt:.45,growth:.25,life:8,process:0,absorb:0,capacity:0,shade:.05},
 {name:'阴蕨',layer:0,temp:18,tol:22,water:.7,wt:.4,growth:.22,life:12,process:0,absorb:0,capacity:0,shade:.05},
 {name:'凝露草',layer:0,temp:20,tol:25,water:.58,wt:.45,growth:.15,life:25,process:.045,absorb:.12,capacity:6,shade:.05},
 {name:'敛灵苔',layer:0,temp:13,tol:25,water:.68,wt:.4,growth:.12,life:35,process:.005,absorb:.38,capacity:18,shade:.04},
 {name:'山松',layer:1,temp:15,tol:30,water:.35,wt:.45,growth:.04,life:220,process:0,absorb:0,capacity:0,shade:.6},
 {name:'泽榆',layer:1,temp:24,tol:25,water:.65,wt:.45,growth:.045,life:180,process:0,absorb:0,capacity:0,shade:.8},
 {name:'天青灵树',layer:1,temp:22,tol:28,water:.55,wt:.5,growth:.045,life:650,process:1.2,absorb:.16,capacity:90,shade:.9},
 {name:'地髓古榕',layer:1,temp:43,tol:34,water:.38,wt:.55,growth:.035,life:800,process:0,absorb:.55,capacity:140,shade:.95}
];
// Color, shape and habitat belong to each species, never to an arbitrary map zone.
const appearances=[['#b5ad61',7],['#6f9979',1],['#a9c9c3',5],['#81909f',2],['#3f7261',0],['#8a9855',1],['#64ada6',5],['#74495d',6]];
PLANTS.forEach((p,i)=>Object.assign(p,{color:appearances[i][0],sprite:appearances[i][1],shadeLover:i===1||i===3,root:i===7}));
const variants=[
 ['银针松',4,-12,27,.40,.40,'#b7cbd4',2],['赤叶枫',5,12,23,.51,.32,'#ac7253',3],
 ['雨林榕',5,31,20,.82,.30,'#397b53',4],['金冠槐',4,30,25,.18,.26,'#bead62',7],
 ['雪绒草',0,-16,24,.42,.37,'#b9c6be',2],['赤砂草',0,36,24,.13,.22,'#ba8860',7],
 ['沼泽苇',1,24,24,.84,.23,'#799b7e',1],['霜华灵松',6,-54,62,.40,.48,'#8cb9ce',2],
 ['焰叶灵木',7,112,105,.20,.40,'#a65340',6],['紫露灵蕨',2,17,22,.78,.29,'#9a84ab',5],
 ['寒晶灵苔',3,-250,280,.26,.40,'#c2d9e1',2],['炽岩灵藓',3,330,360,.10,.27,'#cb7350',6]
];
for(const [name,base,temp,tol,water,wt,color,sprite]of variants)PLANTS.push({...PLANTS[base],name,temp,tol,water,wt,color,sprite});
export const SPECIES_COUNT=PLANTS.length;
const layerSpecies=[0,1].map(l=>PLANTS.flatMap((p,t)=>p.layer===l?[t]:[]));
const ordinarySpecies=layerSpecies.map(ts=>ts.filter(t=>!PLANTS[t].capacity));
const spiritualSpecies=PLANTS.flatMap((p,t)=>p.capacity?[t]:[]);
export function mountainResistance(w,i){
 const x=i%w.width,y=Math.floor(i/w.width),h=w.elevation[i];let low=h;
 for(const [dx,dy]of [[-4,0],[4,0],[0,-4],[0,4]]){const xx=clamp(x+dx,0,w.width-1),yy=clamp(y+dy,0,w.height-1);low=Math.min(low,w.elevation[yy*w.width+xx]);}
 // Raised, prominent ridges block; a uniformly elevated plateau is not a wall.
 return clamp((h-.38)/.30)*clamp((h-low)/.10);
}
export function terrainPassage(w,i,j){
 const base=Math.exp(-Math.abs(w.elevation[i]-w.elevation[j])*9)*(.6+.4*(1-Math.max(w.rock[i],w.rock[j])));
 const barrier=w.mountainBarrier? (w.mountainBarrier[i]+w.mountainBarrier[j])*.5:(mountainResistance(w,i)+mountainResistance(w,j))*.5;
 return base*Math.exp(-barrier*4);
}
export class Landscape{
 constructor({width=512,height=256,seed='横陆-001'}={}){
  if(height!==256||![512,768,1024].includes(width))throw Error('验证地图采用 256 × 512 / 768 / 1024');
  this.width=width;this.height=height;this.n=width*height;this.seed=seed;this.s=seedOf(seed);this.year=0;this.input=0;this.escaped=0;this.manual=0;this.history=[];this.events=[];
  const names=['elevation','mantle','mantleX','mantleY','compression','rift','heat','rock','tempBase','rain','rainfall','snow','waterBase','temp','water','lake','river','source','ground','air','soil','detritus','retention','attract','field','diffusion','geology','processing','binding','change','root','increment','inflow','outflow','escape','uptake','release','blocked','flowX','flowY','flowE','flowS','delta'];
  for(const k of names)this[k]=new Float64Array(this.n);this.plate=new Uint8Array(this.n);this.pass=new Uint8Array(this.n);this.down=new Int32Array(this.n).fill(-1);this.order=[];
  this.type=new Int8Array(this.n*2).fill(-1);for(const k of ['mass','qi','age','maturity'])this[k]=new Float64Array(this.n*2);this.stage=new Uint8Array(this.n*2);this.seeds=new Float32Array(this.n*SPECIES_COUNT);
  this.generate();this.initial=this.total();this.record();
 }
 neighbors(i){const w=this.width,x=i%w;return[x?i-1:-1,x<w-1?i+1:-1,i>=w?i-w:-1,i<this.n-w?i+w:-1].filter(j=>j>=0);}
 generate(){
  // 1: seven structural plates anchored to the reference layout, seeded perturbations.
  const anchors=[[.43,-.025],[.10,.32],[.43,.40],[.36,.82],[.08,.72],[.70,.40],[1.08,.53]];
  this.plates=anchors.map(([x,y],p)=>({x:x+(hash(p,1,this.s)-.5)*.035,y:y+(hash(p,2,this.s)-.5)*.035,ocean:p===6}));
  const shapes=[[[.06,-.025],[.30,-.05],[.56,-.025],[.81,-.01]],[[.08,.25],[.09,.41]],[[.41,.37],[.49,.46]],[[.27,.82],[.45,.84]],[[.045,.67],[.075,.81]],[[.69,.33],[.73,.57]],[[1.07,.25],[1.08,.70]]];
  this.coastline=[[-.12,-.08],[.68,-.08],[.75,.04],[.80,.08],[.78,.14],[.84,.17],[.81,.21],[.74,.23],[.78,.27],[.83,.28],[.80,.33],[.85,.36],[.89,.33],[.92,.35],[.88,.40],[.81,.41],[.78,.46],[.81,.50],[.75,.54],[.73,.59],[.77,.62],[.74,.67],[.69,.64],[.65,.63],[.63,.58],[.60,.60],[.59,.67],[.62,.72],[.58,.75],[.54,.74],[.53,.80],[.48,.81],[.50,.86],[.46,.88],[.43,.83],[.39,.85],[.35,.90],[.32,.86],[.28,.88],[.25,.82],[.22,.84],[.19,.89],[.14,.86],[.10,.88],[.07,.84],[-.12,.83]].map(([x,y],k)=>[x+(hash(k,54,this.s)-.5)*.012,y+(hash(k,55,this.s)-.5)*.012]);
  // Four inherited offshore crust fragments, with unequal footprints.
  this.islands=[[.915,.72,.036,.067,.10],[.75,.915,.025,.037,.065],[.95,.36,.016,.026,.04],[.88,.88,.010,.016,.025]].map(([x,y,rx,ry,u],k)=>({x:x+(hash(k,91,this.s)-.5)*.008,y:y+(hash(k,92,this.s)-.5)*.008,rx,ry,u}));
  this.coastline=roundedCoast(this.coastline);
  this.coastEdges=this.coastline.map(([ax,ay],i)=>{const [bx,by]=this.coastline[(i+1)%this.coastline.length],dx=bx-ax,dy=by-ay;return{ax,ay,bx,by,dx,dy,len:dx*dx+dy*dy,minX:Math.min(ax,bx),maxX:Math.max(ax,bx),minY:Math.min(ay,by),maxY:Math.max(ay,by)};});
  this.plates.forEach((p,k)=>p.sites=shapes[k].map(([x,y])=>({x:x+p.x-anchors[k][0],y:y+p.y-anchors[k][1]})));
  // 2: mantle upwellings and circulation. Plate drift samples the same field,
  // with layout-constrained long-term drift; this is a generative proxy, not a fluid solver.
  const cells=[[.13,.72,1.3],[.61,.40,.55],[.82,.12,.5]];
  const mantleAt=(x,y)=>{let heat=0,vx=0,vy=0;for(const [cx,cy,a]of cells){const g=gauss(x,y,cx,cy,.28,.33)*a;heat+=g;vx+=(x-cx)*g*2;vy+=(y-cy)*g*2;}return[heat,vx,vy];};
  const drift=[[0,.65],[.55,.03],[-.1,-.13],[.05,-.85],[-.55,.18],[-.25,.08],[-.65,0]];
  this.plates.forEach((p,k)=>{const [,vx,vy]=mantleAt(p.x,p.y);p.vx=vx*.28+drift[k][0];p.vy=vy*.28+drift[k][1];});
  for(let i=0;i<this.n;i++){
   const x=i%this.width/(this.width-1),y=Math.floor(i/this.width)/(this.height-1);let a=0,b=1,da=Infinity,db=Infinity;
   const gx=x+(noise(x*5,y*5,this.s+71)-.5)*.055,gy=y+(noise(x*6,y*5,this.s+72)-.5)*.060,sites=[];
   for(let p=0;p<7;p++){let d=Infinity,site;for(const t of this.plates[p].sites){const v=((gx-t.x)*1.7)**2+(gy-t.y)**2;if(v<d){d=v;site=t;}}sites[p]=site;if(d<da){db=da;b=a;da=d;a=p;}else if(d<db){db=d;b=p;}}
   this.plate[i]=a;const A=this.plates[a],B=this.plates[b],dx=sites[b].x-sites[a].x,dy=sites[b].y-sites[a].y,len=Math.hypot(dx*1.7,dy),nx=dx*1.7/len,ny=dy/len;
   const distance=(db-da)/(2*len),belt=Math.exp(-((distance/.042)**2)),relative=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny;
   this.compression[i]=belt*Math.max(0,-relative);this.rift[i]=belt*Math.max(0,relative);
   const [mh,mx,my]=mantleAt(x,y);this.mantle[i]=mh;this.mantleX[i]=mx;this.mantleY[i]=my;
   // 3: coast, inherited uplands, boundary uplift and extensional troughs.
   let coast=coastDistance(x,y,this.coastEdges),islandUplift=0;
   for(const t of this.islands){const r=Math.hypot((x-t.x)/t.rx,(y-t.y)/t.ry),angle=Math.atan2((y-t.y)/t.ry,(x-t.x)/t.rx),edge=(1-r+Math.sin(angle*3+this.s)*.17+Math.cos(angle*5)*.09+(noise(x*100,y*80,this.s+94)-.5)*.16)*Math.min(t.rx,t.ry);if(edge>coast){coast=edge;islandUplift=t.u*Math.max(0,1-r);}}
   const broad=.24+.14*gauss(x,y,.12,.29,.28,.24)+.12*gauss(x,y,.45,.05,.6,.16);
   const uplift=this.compression[i]*.40*(.40+noise(x*36,y*30,this.s+1)*.9);
   const localMount=Math.max(0,noise(x*23,y*19,this.s+83)-.66)**2*4.5;
   const folds=localMount+(noise(x*30,y*24,this.s+2)-.5)*.020+(noise(x*80,y*65,this.s+3)-.5)*.012;
   const basinR=Math.hypot((gx-.49)/.075,(gy-.45)/.06);
   const interior=-.020*gauss(x,y,.48,.43,.23,.18)+.015*Math.exp(-(((basinR-1)/.2)**2))-.009*Math.exp(-((basinR/.7)**2));
   const crust=Math.max(.218,broad+uplift+islandUplift+Math.min(.4,Math.max(0,mh-.8)**4*2)-this.rift[i]*.08+interior+folds);
   const shore=clamp(coast/.021),blend=shore*shore*(3-2*shore);
   this.elevation[i]=coast<=0?clamp(.205+coast*2,0,.205):.205+(crust-.205)*blend;
   this.heat[i]=Math.max(0,(mh-.38)*13)+this.rift[i]*14+(a===5&&b===6||a===6&&b===5?this.compression[i]*6:0);
   this.rock[i]=clamp(.25+this.compression[i]*.4+this.heat[i]*.015+(noise(x*13,y*13,this.s+4)-.5)*.3);
  }
  // Connected ground routes follow low-cost saddles; only cut the few impassable
  // ridges on the selected route. Record cuts, don't silently claim natural erosion.
  this.carveRegionalRiver();
  this.buildPasses();
  // 4: latitudinal temperature plus height, aspect and geothermal contribution.
  for(let i=0;i<this.n;i++){
   const y=Math.floor(i/this.width)/(this.height-1),x=i%this.width/(this.width-1),slope=this.elevation[Math.max(0,i-this.width)]-this.elevation[Math.min(this.n-1,i+this.width)];
   const cold=gauss(x,y,.48,.045,.026,.040),hot=gauss(x,y,.115,.71,.023,.036);
   // Fictional world temperature: below -273 is not Celsius.
   this.tempBase[i]=clamp(7+y*42-this.elevation[i]*27-28*gauss(x,y,.47,.06,.48,.17)+this.heat[i]*1.1+slope*8-1040*cold**2+1040*hot**2,-1000,1000);
   this.temp[i]=this.tempBase[i];
   this.rain[i]=clamp(.36+.36*x+.31*gauss(x,y,.4,.78,.32,.21)-.42*gauss(x,y,.16,.32,.24,.22)-.20*gauss(x,y,.10,.70,.14,.16)+(noise(x*9,y*8,this.s+95)-.5)*.16);
   this.waterBase[i]=clamp(this.rain[i]-.12*clamp((this.temp[i]-32)/40));precipitation(this,i);
  }
  // 5: depression filling and drainage, then hydrological moisture adjustment.
  this.drainage();this.settleLargeLakes();this.buildPasses(false);
  for(let i=0;i<this.n;i++){this.waterBase[i]=clamp(this.waterBase[i]+Math.min(.25,this.river[i]*.08)+(this.lake[i]>.009?.22:0));this.water[i]=this.waterBase[i];
   // 6: geological sources follow exposure, rock, thermal and fracture setting.
   this.source[i]=this.land(i)?(.005+this.rock[i]**5*.08+(this.heat[i]/24)**3*.45)*( .25+this.compression[i]+this.rift[i]):0;
   this.ground[i]=this.land(i)?(12+this.rock[i]*65)*noise(i%this.width/18,Math.floor(i/this.width)/18,this.s+5):0;
   this.air[i]=this.land(i)? .4+this.source[i]*2:0;this.soil[i]=this.land(i)?this.water[i]*.4:0;
   // 7: habitat-based ordinary populations, sparse spiritual seeds and plants.
   if(!this.land(i))continue;
   for(let l=0;l<2;l++){const choices=ordinarySpecies[l];let best=choices[0],fit=0;for(const t of choices){const f=this.fit(i,t);if(f>fit){best=t;fit=f;}}if(fit>.16&&hash(i,l+30,this.s)>.16){this.type[i*2+l]=best;this.mass[i*2+l]=fit*(l?(.5+this.water[i]*1.5):1.4);this.age[i*2+l]=hash(i,l,this.s)*PLANTS[best].life*.5;}}
   let spirit=-1,bestFit=0;
   for(const t of spiritualSpecies){const f=this.fit(i,t);if(f>bestFit){bestFit=f;spirit=t;}if(f>.3&&hash(i,100+t,this.s)<.008)this.seeds[i*SPECIES_COUNT+t]=.22;}
   if(spirit>=0&&bestFit>.23&&hash(i,9,this.s)<(PLANTS[spirit].layer?.0012:.022)){
    const sp=PLANTS[spirit],k=i*2+sp.layer;this.type[k]=spirit;this.mass[k]=sp.layer?.65:.35;this.qi[k]=this.mass[k]*sp.capacity*.22;this.age[k]=sp.layer?55:3;this.seeds[i*SPECIES_COUNT+spirit]=.3;
   }
  }
  this.mountainBarrier=Float64Array.from(this.elevation,(_,i)=>mountainResistance(this,i));
  this.edgeEast=new Float64Array(this.n);this.edgeSouth=new Float64Array(this.n);
  for(let i=0;i<this.n;i++){if(i%this.width<this.width-1)this.edgeEast[i]=terrainPassage(this,i,i+1);if(i<this.n-this.width)this.edgeSouth[i]=terrainPassage(this,i,i+this.width);}
  this.derive();
 }
 land(i){return this.elevation[i]>.205&&this.lake[i]<.009;}
 buildPasses(carve=true){
  const places=[[.12,.32],[.43,.16],[.47,.43],[.35,.78],[.10,.70],[.72,.45]].map(([x,y])=>{
   const cx=Math.round(x*(this.width-1)),cy=Math.round(y*(this.height-1));let best=-1,score=Infinity;
   for(let yy=Math.max(0,cy-20);yy<Math.min(this.height,cy+21);yy++)for(let xx=Math.max(0,cx-30);xx<Math.min(this.width,cx+31);xx++){const i=yy*this.width+xx;if(!this.land(i))continue;const d=Math.hypot((xx-cx)/this.width,(yy-cy)/this.height)+Math.max(0,this.elevation[i]-.40)*.15;if(d<score){score=d;best=i;}}
   return best;
  });
  this.routes=[];for(const goal of places.filter((_,i)=>i!==2)){
   const start=places[2];if(start<0||goal<0||start===goal)continue;const dist=new Float64Array(this.n).fill(Infinity),prev=new Int32Array(this.n).fill(-1),heap=new Heap(dist);dist[start]=0;heap.push(start);const seen=new Uint8Array(this.n);
   while(heap.items.length){const i=heap.pop();if(seen[i])continue;seen[i]=1;if(i===goal)break;for(const j of this.neighbors(i)){if(!this.land(j)||seen[j])continue;const cost=1+Math.max(0,this.elevation[j]-.34)**2*150+Math.abs(this.elevation[j]-this.elevation[i])*30;const d=dist[i]+cost;if(d<dist[j]){dist[j]=d;prev[j]=i;heap.push(j);}}}
   if(!Number.isFinite(dist[goal]))continue;const route=[];for(let i=goal;i>=0;i=prev[i]){route.push(i);if(carve&&this.elevation[i]>.53){this.pass[i]=1;this.elevation[i]=.52;}if(i===start)break;}this.routes.push(route);
  }
 }
 // A layout constraint on an inherited rift valley, not a painted water line.
 // Tributaries drain toward the same descending trunk; final rivers use catchment.
 carveRegionalRiver(){
  const paths=[[[.55,.17],[.57,.32],[.54,.48],[.59,.59],[.64,.70]],
   [[.28,.38],[.42,.43],[.54,.48]],[[.36,.77],[.48,.66],[.59,.59]]];
  const levels=[[.34,.30,.26,.23,.202],[.33,.29,.26],[.30,.26,.23]];
  for(let p=0;p<paths.length;p++)for(let k=0;k<paths[p].length-1;k++){
   const [ax,ay]=paths[p][k],[bx,by]=paths[p][k+1],dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
   for(let y=Math.max(0,Math.floor((Math.min(ay,by)-.025)*this.height));y<Math.min(this.height,Math.ceil((Math.max(ay,by)+.025)*this.height));y++)
    for(let x=Math.max(0,Math.floor((Math.min(ax,bx)-.025)*this.width));x<Math.min(this.width,Math.ceil((Math.max(ax,bx)+.025)*this.width));x++){
     const i=y*this.width+x;if(this.elevation[i]<=.205)continue;
     const xx=x/(this.width-1),yy=y/(this.height-1),t=clamp(((xx-ax)*dx+(yy-ay)*dy)/len),d=Math.hypot((xx-ax-t*dx)*1.7,yy-ay-t*dy);
     if(d>.022)continue;const floor=levels[p][k]*(1-t)+levels[p][k+1]*t;
     this.elevation[i]=Math.min(this.elevation[i],floor+d*3.8);
    }
  }
 }
 settleLargeLakes(){
  // Large filled depressions represent old sedimentary basins. Keep a small
  // residual lake around the deepest point, rather than flood a whole region.
  const seen=new Uint8Array(this.n);let changed=false;
  for(let i=0;i<this.n;i++){if(seen[i]||this.lake[i]<.009)continue;const cells=[i];seen[i]=1;let deep=i;
   for(let k=0;k<cells.length;k++){const a=cells[k];if(this.lake[a]>this.lake[deep])deep=a;for(const j of this.neighbors(a))if(!seen[j]&&this.lake[j]>=.009){seen[j]=1;cells.push(j);}}
   if(cells.length<=60)continue;changed=true;const cx=deep%this.width,cy=Math.floor(deep/this.width),rx=this.width/128,ry=3;
   for(const a of cells){if(((a%this.width-cx)/rx)**2+((Math.floor(a/this.width)-cy)/ry)**2<=1)continue;this.elevation[a]+=this.lake[a]-.005;}
  }
  if(changed){this.lake.fill(0);this.river.fill(0);this.down.fill(-1);this.drainage();}
 }
 drainage(){
  const seen=new Uint8Array(this.n),level=new Float64Array(this.n),heap=new Heap(level);this.order=[];
  for(let i=0;i<this.n;i++)if(this.elevation[i]<=.205||i<this.width||i>=this.n-this.width||i%this.width===0||i%this.width===this.width-1){seen[i]=1;level[i]=this.elevation[i];heap.push(i);}
  while(heap.items.length){const i=heap.pop();this.order.push(i);for(const j of this.neighbors(i)){if(seen[j])continue;seen[j]=1;level[j]=Math.max(this.elevation[j],level[i]+1e-7);this.lake[j]=Math.max(0,level[j]-this.elevation[j]);this.down[j]=i;heap.push(j);}}
  const catchment=Float64Array.from(this.waterBase,v=>.3+v);for(let k=this.order.length-1;k>=0;k--){const i=this.order[k],j=this.down[i];if(j>=0)catchment[j]+=catchment[i];}
  for(let i=0;i<this.n;i++)this.river[i]=this.elevation[i]>.205&&catchment[i]>45?Math.log1p(catchment[i]/45):0;
 }
 fit(i,t){const s=PLANTS[t],shade=s.layer===0?this.mass[i*2+1]*(PLANTS[this.type[i*2+1]]?.shade||0):0;return clamp(1-Math.abs(this.temp[i]-s.temp)/s.tol)*clamp(1-Math.abs(this.water[i]-s.water)/s.wt)*(s.shadeLover?(.65+clamp(shade)*.35):(1-clamp(shade)*.55));}
 derive(){
  for(let i=0;i<this.n;i++){
   const tk=i*2+1,t=PLANTS[this.type[tk]],cover=t?clamp(this.mass[tk]*t.shade/3):0;
   this.retention[i]=this.land(i)?clamp(.12+this.rock[i]*.18+this.water[i]*.12+cover*.43,.05,.88):.05;
   let attraction=this.land(i)?.04*this.rock[i]*this.water[i]:0;
   for(let l=0;l<2;l++){const k=i*2+l,s=PLANTS[this.type[k]];if(s?.absorb){const cap=this.mass[k]*s.capacity*2**this.stage[k];attraction+=s.absorb*this.mass[k]*1.25**this.stage[k]*clamp(1-this.qi[k]/Math.max(1e-9,cap))*this.fit(i,this.type[k]);}}
   this.attract[i]=attraction;this.field[i]=attraction;this.diffusion[i]=this.land(i)?clamp(.30-this.retention[i]*.18,.04,.32):.22;
  }
  // Finite 8-cell radiation; no unbounded whole-world per-tree path solver.
  const tmp=new Float64Array(this.n);for(let r=0;r<8;r++){
   for(let i=0;i<this.n;i++){let v=this.field[i];const x=i%this.width;for(const j of [x?i-1:-1,x<this.width-1?i+1:-1,i>=this.width?i-this.width:-1,i<this.n-this.width?i+this.width:-1])if(j>=0)v=Math.max(v,this.field[j]*.74*this.passage(i,j));tmp[i]=v;}
   this.field.set(tmp);
  }
 }
 passage(i,j){if(this.edgeEast)return (Math.abs(j-i)===1?this.edgeEast:this.edgeSouth)[Math.min(i,j)];return terrainPassage(this,i,j);}

 transport(){
  this.blocked.fill(0);this.delta.fill(0);this.flowE.fill(0);this.flowS.fill(0);this.inflow.fill(0);this.outflow.fill(0);this.flowX.fill(0);this.flowY.fill(0);
  const transfer=(i,j,axis)=>{
   const pass=this.passage(i,j),d=(this.air[i]-this.air[j])*(this.diffusion[i]+this.diffusion[j])*.5 + (this.field[j]-this.field[i])*(this.air[i]+this.air[j])*.09;
   const a=d>=0?i:j,b=a===i?j:i,sign=d>=0?1:-1;
   const budget=Math.min(this.air[a]*.18,Math.max(0,100-this.air[b])*.18),request=Math.abs(d)*pass*(1-this.retention[a]);
   const q=Math.min(request,budget),barrier=((this.mountainBarrier?.[i]||0)+(this.mountainBarrier?.[j]||0))*.5;
   // Counterfactual blocked amount is diagnostic, never another inventory pool.
   this.blocked[a]+=Math.max(0,Math.min(request*Math.exp(barrier*4),budget)-q);
   this.delta[a]-=q;this.delta[b]+=q;this.outflow[a]+=q;this.inflow[b]+=q;(axis===0?this.flowE:this.flowS)[i]=q*sign;
  };
  for(let i=0;i<this.n;i++){if(i%this.width<this.width-1)transfer(i,i+1,0);if(i<this.n-this.width)transfer(i,i+this.width,1);}
  for(let i=0;i<this.n;i++){this.air[i]+=this.delta[i];const x=i%this.width;this.flowX[i]=(this.flowE[i]+(x?this.flowE[i-1]:0))*.5;this.flowY[i]=(this.flowS[i]+(i>=this.width?this.flowS[i-this.width]:0))*.5;}
 }
 step(){
  const before=this.total(),airBefore=this.air.slice();let added=0,escaped=0;
  for(const k of ['geology','processing','binding','change','root','increment','uptake','release','escape'])this[k].fill(0);
  for(let i=0;i<this.n;i++){
   const k=i*2+1,s=PLANTS[this.type[k]],cover=s?clamp(this.mass[k]*s.shade/3):0;
   this.temp[i]=clamp(this.temp[i]+(this.tempBase[i]-cover*6-this.temp[i])*.15,-1000,1000);precipitation(this,i);
   this.water[i]+=(clamp(this.waterBase[i]*(1+cover*.23))-this.water[i])*.12;
   const g=Math.min(this.source[i],Math.max(0,180-this.ground[i]));this.ground[i]+=g;added+=g;this.geology[i]=g;
   const vent=Math.min(this.ground[i],Math.max(0,this.ground[i]*.012-this.air[i]*.012),Math.max(0,100-this.air[i]));this.ground[i]-=vent;this.air[i]+=vent;this.increment[i]+=vent;
   const decomp=Math.min(this.detritus[i]*.07*(.3+this.water[i]),Math.max(0,100-this.air[i]));this.detritus[i]-=decomp;this.air[i]+=decomp;this.increment[i]+=decomp;
   const bind=Math.min(this.air[i]*.008,this.water[i]*8+this.rock[i]*8-this.soil[i]);if(bind>0){this.air[i]-=bind;this.soil[i]+=bind;this.binding[i]=bind;}const weather=Math.min(this.soil[i]*.012,Math.max(0,100-this.air[i]));this.soil[i]-=weather;this.air[i]+=weather;this.increment[i]+=weather;
   for(let l=1;l>=0;l--){const p=i*2+l,t=this.type[p],s=PLANTS[t];if(!s)continue;const fit=this.fit(i,t),cap=this.mass[p]*s.capacity*2**this.stage[p];
    const processing=Math.min(s.process*this.mass[p]*fit,Math.max(0,cap-this.qi[p]),3);this.qi[p]+=processing;added+=processing;this.processing[i]+=processing;
    const root=s.root?Math.min(this.ground[i],Math.max(0,cap-this.qi[p]),this.mass[p]*.65*fit):0;this.ground[i]-=root;this.qi[p]+=root;this.root[i]+=root;
    const absorb=Math.min(this.air[i],Math.max(0,cap-this.qi[p]),s.absorb*this.mass[p]*1.25**this.stage[p]*fit*this.air[i]/(2+this.air[i]));this.air[i]-=absorb;this.qi[p]+=absorb;this.uptake[i]+=absorb;
    const release=Math.min(this.qi[p],processing*.30+Math.max(0,this.qi[p]-cap*.88)*.018,Math.max(0,100-this.air[i]));this.qi[p]-=release;this.air[i]+=release;this.release[i]+=release;this.increment[i]+=release;
    const supported=s.capacity?clamp(this.qi[p]/Math.max(.1,this.mass[p]*s.capacity*.06)):1;
    const growth=this.mass[p]*s.growth*fit*supported*clamp(1-this.mass[p]/(l?4:7));this.mass[p]+=growth;
    const death=clamp(1/s.life+Math.max(0,.25-fit)*.12,0,.3),litter=this.qi[p]*death;this.qi[p]-=litter;this.detritus[i]+=litter;this.mass[p]*=1-death;this.age[p]++;
    if(s.capacity&&this.qi[p]>=cap*.7&&fit>.2){this.maturity[p]++;if(this.maturity[p]>=8*(this.stage[p]+1)&&this.stage[p]<20){this.stage[p]++;this.maturity[p]=0;if(s.layer&&s.capacity)this.event(i,'灵树质变');}}else this.maturity[p]=Math.max(0,this.maturity[p]-.25);
    if((s.layer&&s.capacity&&this.age[p]>=s.life)||this.mass[p]<.025){if(s.layer&&s.capacity)this.event(i,'灵树死亡，积累转入遗骸');this.detritus[i]+=this.qi[p];this.qi[p]=this.mass[p]=0;this.type[p]=-1;this.stage[p]=0;continue;}
    const seed=this.mass[p]*fit*(l?.03:.10);this.seeds[i*SPECIES_COUNT+t]+=seed;
    const dirs=[i%this.width?i-1:-1,i%this.width<this.width-1?i+1:-1,i>=this.width?i-this.width:-1,i<this.n-this.width?i+this.width:-1];const j=dirs[(i+this.year)%4];if(j>=0)this.seeds[j*SPECIES_COUNT+t]+=seed*.2;
   }
   for(let t=0;t<SPECIES_COUNT;t++)this.seeds[i*SPECIES_COUNT+t]*=.94;
   if(this.land(i))for(let l=0;l<2;l++){
    const p=i*2+l;if(this.type[p]>=0&&this.mass[p]>.14)continue;let best=-1,score=.04;
    for(const t of layerSpecies[l]){const s=PLANTS[t],fit=this.fit(i,t),value=this.seeds[i*SPECIES_COUNT+t]*fit*(s.capacity?clamp(this.air[i]/.8):1);if(value>score){score=value;best=t;}}
    if(best>=0){this.detritus[i]+=this.qi[p];this.qi[p]=0;this.type[p]=best;this.mass[p]=.15;this.stage[p]=0;this.age[p]=0;this.seeds[i*SPECIES_COUNT+best]*=.5;}
   }
  }
  this.derive();this.transport();
  for(let i=0;i<this.n;i++){
   const neighborhood=this.field[i],rate=.075*(1-this.retention[i])/(1+neighborhood*.5);const q=this.air[i]*-Math.expm1(-rate);this.air[i]-=q;this.escape[i]=q;this.change[i]=this.air[i]-airBefore[i];escaped+=q;
  }
  this.year++;this.input+=added;this.escaped+=escaped;this.last={before,added,escaped,after:this.total()};this.last.error=this.last.after-before-added+escaped;
  if(this.year%5===0)this.record();
 }
 event(i,text){this.events.push({year:this.year+1,i,text});if(this.events.length>100)this.events.shift();}
 edit(i,kind){if(!this.land(i))return;if(kind==='source'){this.source[i]=this.source[i]>.2?0:.6;this.event(i,'调整地质供给');}else if(kind==='tree'){const p=i*2+1;this.detritus[i]+=this.qi[p];this.type[p]=6;this.mass[p]=1;this.qi[p]=0;this.age[p]=this.stage[p]=this.maturity[p]=0;this.event(i,'种下一株灵树（后天库存为零）');}else if(kind==='remove'){for(let l=0;l<2;l++){const p=i*2+l;this.detritus[i]+=this.qi[p];this.qi[p]=this.mass[p]=0;this.type[p]=-1;this.stage[p]=0;}this.event(i,'移除植被，灵气进入遗骸');}this.derive();}
 total(){let q=0;for(let i=0;i<this.n;i++)q+=this.air[i]+this.ground[i]+this.soil[i]+this.detritus[i]+this.qi[i*2]+this.qi[i*2+1];return q;}
 summary(){let air=0,plant=0,forest=0,spirit=0,stages=0;for(let i=0;i<this.n;i++){air+=this.air[i];plant+=this.qi[i*2]+this.qi[i*2+1];if(this.mass[i*2+1]>.6)forest++;if(PLANTS[this.type[i*2+1]]?.capacity)spirit++;stages+=this.stage[i*2+1];}return{year:this.year,air,plant,forest,spirit,stages,total:this.total(),input:this.input,escaped:this.escaped};}
 record(){this.history.push(this.summary());if(this.history.length>1000)this.history=this.history.filter((_,i)=>i===0||i%2===0||i===1000);}
 snapshot(){const out={width:this.width,height:this.height,year:this.year,seed:this.seed,plates:this.plates,routes:this.routes,history:this.history.at(-1)?.year===this.year?this.history:[...this.history,this.summary()],events:this.events,ledger:{initial:this.initial,total:this.total(),input:this.input,escaped:this.escaped,error:this.total()-this.initial-this.input+this.escaped,last:this.last}};for(const k of ['elevation','plate','mantle','mantleX','mantleY','compression','rift','heat','rock','temp','rain','rainfall','snow','water','lake','river','source','ground','air','soil','detritus','retention','attract','field','diffusion','geology','processing','binding','change','root','increment','inflow','outflow','escape','uptake','release','flowX','flowY','type','mass','qi','age','stage','pass','down','blocked','mountainBarrier','edgeEast','edgeSouth'])out[k]=this[k];return out;}
}
