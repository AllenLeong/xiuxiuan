import {landformAt} from './landforms.js';
// Seeded continental structure -> elevation -> drainage -> regional moisture.
// Rivers are derived from terrain. Political labels never enter this module.
export const SEA_LEVEL=.23;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function distanceToChain(x,y,points){let d=Infinity;for(let j=1;j<points.length;j++){const [ax,ay]=points[j-1],[bx,by]=points[j],dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy));d=Math.min(d,Math.hypot(x-ax-t*dx,y-ay-t*dy));}return d;}
export function generateTerrain(w,noise){
 const n=w.size,seed=w.rng;
 const jitter=(v,j,axis)=>v+(noise(j*.71,axis,seed+111)-.5)*.085;
 const chains=[[[.16,.22],[.28,.29],[.34,.40],[.42,.49],[.45,.63]],[[.29,.31],[.18,.44],[.15,.56]],[[.34,.41],[.51,.35],[.61,.26]],[[.59,.23],[.67,.37],[.62,.48]],[[.52,.62],[.61,.72],[.65,.82]]].map((line,l)=>line.map(([x,y],j)=>[jitter(x,l*9+j,1),jitter(y,l*9+j,3)]));
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x,nx=x/(n-1),ny=y/(n-1),wx=nx+(noise(nx*4,ny*4,seed+1)-.5)*.105,wy=ny+(noise(nx*4,ny*4,seed+2)-.5)*.105;
  const ellipse=(cx,cy,rx,ry)=>1-Math.hypot((wx-cx)/rx,(wy-cy)/ry);
  let land=Math.max(ellipse(.43,.39,.49,.35),ellipse(.35,.60,.34,.32),ellipse(.65,.60,.27,.24),ellipse(.43,.80,.14,.24));
  land+=(noise(nx*16,ny*16,seed+3)-.5)*.065+(noise(nx*35,ny*35,seed+4)-.5)*.02;
  // Broad embayments cut into land; peninsulas come from overlapping land masses.
  land-=.48*Math.exp(-(((wx-.82)/.16)**2+((wy-.40)/.12)**2));
  land-=.35*Math.exp(-(((wx-.57)/.10)**2+((wy-.86)/.15)**2));
  let elevation=SEA_LEVEL+land*.49;
  if(land>0){
   let ridge=0;
   for(let j=0;j<chains.length;j++){const d=distanceToChain(wx,wy,chains[j]),width=j===0?.04:.027;ridge=Math.max(ridge,Math.exp(-((d/width)**2))*(j===0?.47:.30));}
   const folds=.75+.25*noise(nx*23,ny*23,seed+8);
   elevation+=ridge*folds*clamp(land*12);
   elevation+=(noise(nx*13,ny*13,seed+9)-.5)*.07*clamp(land*8);
   // Interior basin remains below its enclosing ranges, not an arbitrary rectangular lowland.
   elevation-=.17*Math.exp(-(((wx-.46)/.13)**2+((wy-.47)/.11)**2));
  }
  elevation+=.42*Math.exp(-(((wx-.530)/.012)**2+((wy-.495)/.012)**2))*clamp(land*10);
  // Raised low-relief interior with a steep rim: a plateau, not just a tall mountain.
  if(land>.08){const pd=Math.hypot((wx-.20)/.135,(wy-.34)/.105),blend=clamp((1-pd)/.22);const plateau=.64+(noise(nx*5,ny*5,seed+123)-.5)*.025;elevation=elevation*(1-blend)+plateau*blend;}
  // Connected fractured belts share the geological framework with the mountain chains.
  // A narrow connected core conducts; surrounding compact rock limits cross-belt leakage.
  let faultDistance=Infinity;for(const chain of chains)faultDistance=Math.min(faultDistance,distanceToChain(wx,wy,chain));
  w.fracture[i]=Math.exp(-((faultDistance/.025)**2));
  w.height[i]=clamp(elevation);w.rock[i]=clamp(.35+.5*noise(nx*8,ny*8,seed+50)+.15*(1-w.fracture[i]));w.heat[i]=Math.pow(noise(nx*7,ny*7,seed+70),5)*55*(.25+.75*w.fracture[i])*w.config.geothermal;
 }
 // Store the same geological axes as continuous, seed-stable map geometry.
 w.qiChannels=chains.map(line=>{const points=[];for(let j=1;j<line.length;j++){const a=line[j-1],b=line[j],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*n*2);for(let k=0;k<=steps;k++){const wx=a[0]+(b[0]-a[0])*k/steps,wy=a[1]+(b[1]-a[1])*k/steps;let nx=wx,ny=wy;for(let it=0;it<6;it++){nx=wx-(noise(nx*4,ny*4,seed+1)-.5)*.105;ny=wy-(noise(nx*4,ny*4,seed+2)-.5)*.105;}points.push([clamp(nx)*(n-1)+.5,clamp(ny)*(n-1)+.5]);}}return{points};});
 buildDrainage(w);
 markLakeIslands(w);
 // Surface passages are reciprocal faces: relief obstructs a connection in either direction.
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;for(const [field,dx,dy] of [['surfaceEast',1,0],['surfaceWest',-1,0],['surfaceSouth',0,1],['surfaceNorth',0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n){w[field][i]=0;continue;}const j=yy*n+xx,relief=Math.abs(w.height[i]-w.height[j]),rough=(w.rock[i]+w.rock[j])*.5;w[field][i]=clamp(Math.exp(-relief*n*.75)*(1-rough*.55),.015,1);}}
 w.terrainFeatures=describeTerrain(w);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x,nx=x/n,ny=y/n;
  let wet=Math.max(w.river[i],clamp(w.lakeDepth[i]*30));for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<n&&yy>=0&&yy<n)wet=Math.max(wet,Math.max(w.river[yy*n+xx],clamp(w.lakeDepth[yy*n+xx]*30))/(1+Math.hypot(dx,dy)));}
  let upwind=0;for(let dx=1;dx<=Math.max(2,Math.round(n*.09));dx++)if(x-dx>=0)upwind=Math.max(upwind,w.height[y*n+x-dx]);const rainShadow=Math.max(0,upwind-w.height[i]-.05)*.8;
  w.baseWater[i]=clamp(w.config.rain+.30*noise(nx*6,ny*6,seed+99)-.3*w.height[i]+wet*.28-rainShadow);
 }
}
function buildDrainage(w){
 const n=w.size,N=w.n,visited=new Uint8Array(N),level=new Float64Array(N),order=[],heap=[];
 w.drainage=new Int32Array(N).fill(-1);w.catchment=new Float64Array(N);
 const push=(i,h)=>{let k=heap.length;heap.push({i,h});while(k){const p=(k-1)>>1;if(heap[p].h<=h)break;heap[k]=heap[p];k=p;}heap[k]={i,h};};
 const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let j=k*2+1;if(j+1<heap.length&&heap[j+1].h<heap[j].h)j++;if(heap[j].h>=last.h)break;heap[k]=heap[j];k=j;}heap[k]=last;}return first;};
 for(let i=0;i<N;i++)if(w.height[i]<SEA_LEVEL||i<n||i>=N-n||i%n===0||i%n===n-1){visited[i]=1;level[i]=w.height[i];push(i,level[i]);}
 while(heap.length){const {i,h}=pop();order.push(i);const x=i%n,y=(i/n)|0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||xx>=n||yy<0||yy>=n)continue;const j=yy*n+xx;if(visited[j])continue;visited[j]=1;level[j]=Math.max(w.height[j],h+1e-6);w.drainage[j]=i;push(j,level[j]);}}
 for(let i=0;i<N;i++)w.catchment[i]=w.height[i]>=SEA_LEVEL?1:0;
 for(let j=order.length-1;j>=0;j--){const i=order[j],to=w.drainage[i];if(to>=0)w.catchment[to]+=w.catchment[i];}
 const threshold=Math.max(6,N*.0013);
 for(let i=0;i<N;i++){
  if(w.height[i]<SEA_LEVEL)continue;
  // Fill tiny closed depressions before delineating channels; all river paths descend to an outlet.
  // Flood priority uses an epsilon to order drainage; this is not additional physical elevation.
  const physicalLevel=Math.min(1,level[i]);
  w.lakeDepth[i]=Math.max(0,physicalLevel-w.height[i]);
  w.height[i]=physicalLevel;
  w.river[i]=w.catchment[i]>threshold?clamp(Math.log2(w.catchment[i]/threshold+1)/5,.15,1):0;
 }
}

function describeTerrain(w){
 const n=w.size,N=w.n,features=[];
 const groups=(predicate,kind,minSize,maxGroups)=>{
  const seen=new Uint8Array(N),found=[];
  for(let i=0;i<N;i++){if(seen[i]||!predicate(i))continue;const cells=[i];seen[i]=1;let sx=0,sy=0;
   for(let j=0;j<cells.length;j++){const p=cells[j],x=p%n,y=(p/n)|0;sx+=x;sy+=y;for(const q of [x?p-1:-1,x<n-1?p+1:-1,y?p-n:-1,y<n-1?p+n:-1])if(q>=0&&!seen[q]&&predicate(q)){seen[q]=1;cells.push(q);}}
   if(cells.length<minSize)continue;const cx=sx/cells.length,cy=sy/cells.length;let pick=cells[0],best=Infinity;for(const p of cells){const d=((p%n)-cx)**2+(((p/n)|0)-cy)**2;if(d<best){best=d;pick=p;}}
   found.push({x:pick%n,y:(pick/n)|0,kind,label:kind==='mountain'?'连绵山脉':kind==='sea'?'辽阔海域':kind==='lake'?'幽静湖泊':kind==='island'?'孤立湖岛':kind==='plateau'?'辽阔高原':kind==='basin'?'低洼盆地':kind==='hills'?'起伏丘陵':'开阔平原',cells:cells.length});
  }
  found.sort((a,b)=>b.cells-a.cells);features.push(...found.slice(0,maxGroups));
 };
 const kinds=Array.from({length:N},(_,i)=>landformAt(w,i));
 groups(i=>w.lakeIsland[i]>0,'island',3,1);
 groups(i=>kinds[i]==='高原','plateau',Math.max(8,N*.001),1);
 groups(i=>kinds[i]==='盆地','basin',Math.max(8,N*.001),1);
 groups(i=>kinds[i]==='丘陵','hills',Math.max(8,N*.005),1);
 groups(i=>w.lakeDepth[i]>.012,'lake',Math.max(4,N*.0005),2);
 groups(i=>w.height[i]>.63&&w.lakeDepth[i]<=.012,'mountain',Math.max(5,N*.001),4);
 groups(i=>w.height[i]<.15,'sea',N*.015,1);
 groups(i=>w.height[i]>.27&&w.height[i]<.40&&w.river[i]<.1,'plain',N*.015,2);
 return features;
}

function markLakeIslands(w){const n=w.size,N=w.n,seen=new Uint8Array(N);for(let i=0;i<N;i++){if(seen[i]||w.height[i]<.23||w.lakeDepth[i]>.012)continue;const cells=[i];seen[i]=1;let fresh=false,open=false;for(let k=0;k<cells.length;k++){const p=cells[k],x=p%n,y=(p/n)|0;if(!x||!y||x===n-1||y===n-1)open=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=n||yy<0||yy>=n)continue;const j=yy*n+xx;if(w.height[j]<.23){open=true;continue;}if(w.lakeDepth[j]>.012){fresh=true;continue;}if(!seen[j]){seen[j]=1;cells.push(j);}}}if(fresh&&!open)for(const j of cells)w.lakeIsland[j]=1;}}
