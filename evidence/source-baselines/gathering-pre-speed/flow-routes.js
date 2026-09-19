// Face-normal interpolation preserves zero-flow barriers. It is a display field,
// not another simulation, and never projects flux onto geological guide lines.
export function flowVector(state,prefix,x,y){
 const n=state.size;if(x<0||y<0||x>=n||y>=n)return null;
 const cx=Math.floor(x),cy=Math.floor(y),i=cy*n+cx,e=state.map[prefix+'East'],s=state.map[prefix+'South'];
 if(!e||!s)return null;
 const west=cx?e[i-1]:0,east=cx<n-1?e[i]:0,north=cy?s[i-n]:0,south=cy<n-1?s[i]:0;
 return [west+(east-west)*(x-cx),north+(south-north)*(y-cy)];
}

// Split a short segment at every crossed face, including both faces at corners.
// Every crossing must agree with the recorded signed transfer.
export function flowSegmentAllowed(state,prefix,a,b,sign=1){
 const n=state.size;if(b[0]<0||b[1]<0||b[0]>=n||b[1]>=n)return false;
 const crossings=[],dx=b[0]-a[0],dy=b[1]-a[1];
 for(const [axis,d]of [[0,dx],[1,dy]]){
  if(!d)continue;
  const lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]);
  for(let face=Math.floor(lo)+1;face<=Math.floor(hi);face++)crossings.push({t:(face-a[axis])/d,axis,face,d});
 }
 for(const {t,axis,face,d}of crossings){
  const other=a[1-axis]+(axis?dx:dy)*t;
  // At a corner both incident rows/columns must permit the crossing.
  const cells=[Math.floor(other)];if(Math.abs(other-Math.round(other))<1e-9)cells.push(Math.round(other)-1);
  for(const c of cells){if(c<0||c>=n)return false;
   const index=axis?(face-1)*n+c:c*n+face-1;
   const flux=state.map[prefix+(axis?'South':'East')][index];
   if(!(flux*Math.sign(d)*sign>1e-12))return false;
  }
 }
 return true;
}

// A fixed two-dimensional low-discrepancy sequence. Reversing a row-major
// index groups entire columns when a capped prefix is selected.
export function flowSeeds(n){
 const spacing=Math.max(2,Math.round(n/64)),count=Math.ceil(n/spacing)**2;
 const radical=(index,base)=>{let value=0,fraction=1/base;while(index){value+=(index%base)*fraction;index=Math.floor(index/base);fraction/=base;}return value;};
 return Array.from({length:count},(_,i)=>[radical(i+1,2)*n,radical(i+1,3)*n]);
}

export function flowRoutes(state,prefix){
 const threshold=1e-6,routes=[];
 if(!state.edgeFlowStep||!['ground','air'].includes(prefix))return{routes,threshold};
 const n=state.size,occupied=new Uint8Array(n*n);
 const trace=(seed,sign)=>{
  const points=[],visited=new Set();let p=seed,last=null,length=0,total=0;
  for(let step=0;step<n*12;step++){
   const v=flowVector(state,prefix,...p);if(!v)break;
   const speed=Math.hypot(...v);if(speed<threshold)break;
   const unit=v.map(a=>a/speed*sign);
   if(last&&unit[0]*last[0]+unit[1]*last[1]<0)break;
   const mid=[p[0]+unit[0]*.1,p[1]+unit[1]*.1],mv=flowVector(state,prefix,...mid);
   if(!mv||Math.hypot(...mv)<threshold)break;
   const ms=Math.hypot(...mv),direction=mv.map(a=>a/ms*sign);
   if(direction[0]*unit[0]+direction[1]*unit[1]<0)break;
   const q=[p[0]+direction[0]*.2,p[1]+direction[1]*.2];
   if(!flowSegmentAllowed(state,prefix,p,q,sign))break;
   const key=Math.floor(q[0]*4)+Math.floor(q[1]*4)*n*4;
   if(points.length>4&&visited.has(key)&&key!==Math.floor(p[0]*4)+Math.floor(p[1]*4)*n*4)break;
   visited.add(key);points.push(q);length+=.2;total+=speed;p=q;last=direction;
   if(points.length>8&&occupied[Math.floor(p[1])*n+Math.floor(p[0])])break;
  }
  return{points,length,total};
 };
 for(const [x,y]of flowSeeds(n)){
  if(routes.length>=512)break;
  if(occupied[Math.floor(y)*n+Math.floor(x)])continue;
  const seed=[x,y],back=trace(seed,-1),forward=trace(seed,1);
  if(back.length+forward.length<2.5)continue;
  const points=[...back.points.reverse(),seed,...forward.points];
  for(const [px,py]of points)occupied[Math.floor(py)*n+Math.floor(px)]=1;
  routes.push({points,strength:(back.total+forward.total)/Math.max(1,points.length-1)});
 }
 return{routes,threshold};
}

export function qiGatherings(state){
 const m=state.map,n=state.size,candidates=[],result=[];
 for(let i=0;i<n*n;i++){
  if(m.height[i]<.23)continue;
  const plant=(m.qi?.[i*2]||0)+(m.qi?.[i*2+1]||0),stored=m.ground[i]+m.mineral[i]+plant,score=Math.max(m.air[i]/12,stored/600);
  if(score>=1)candidates.push({i,score,air:m.air[i],stored});
 }
 for(const p of candidates.sort((a,b)=>b.score-a.score)){
  if(result.every(q=>Math.hypot(p.i%n-q.i%n,Math.floor(p.i/n)-Math.floor(q.i/n))>n*.06))result.push(p);
  if(result.length>=18)break;
 }
 return result;
}
