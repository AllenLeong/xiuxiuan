const clamp=v=>Math.max(0,Math.min(1,v));
export function gatheringDefaults(w,i){const affinity=Math.pow(w.fracture[i]*w.rock[i],3);return{rate:affinity*2,limit:2+affinity*120};}
function passage(w,i,j,ground){if(ground)return Math.min(w.conduct[i],w.conduct[j]);const horizontal=j===i+1;return Math.min(w[horizontal?'surfaceEast':'surfaceSouth'][i],w[horizontal?'surfaceWest':'surfaceNorth'][j]);}
export function attractionField(w,ground=false,excludeAncient=-1){
 const own=new Float64Array(w.n),potential=new Float64Array(w.n);
 for(let i=0;i<w.n;i++){
  const stock=ground?w.ground[i]:w.air[i],limit=ground?w.capacity[i]:w.gatherLimit[i];
  own[i]=(ground?w.groundGatherRate[i]:w.gatherRate[i])*clamp(1-stock/limit);
  for(let l=0;l<2;l++){const k=i*2+l;if(!w.count[k])continue;const s=w.s(k);if(!(ground?s.root:s.absorb))continue;const free=clamp(1-w.qi[k]/Math.max(1e-9,w.mass[k]*s.capacity));
   const activeMass=w.mass[k]-(k===excludeAncient?(w.ancients[k]?.mass||0):0);own[i]+=(ground?s.root:s.absorb)*activeMass*free*w.suitability(i,s,w.sun[i]);
  }potential[i]=own[i];
 }
 // Indexed, fixed-capacity heap: one entry per cell, with no per-edge arrays or objects.
 const current=potential,heap=new Int32Array(w.n),position=new Int32Array(w.n).fill(-1);
 let length=0;
 for(let i=0;i<w.n;i++)if(current[i]>1e-8){heap[length]=i;position[i]=length++;}
 const siftDown=start=>{let p=start;const node=heap[p],value=current[node];while(p*2+1<length){let child=p*2+1;if(child+1<length&&current[heap[child+1]]>current[heap[child]])child++;if(current[heap[child]]<=value)break;heap[p]=heap[child];position[heap[p]]=p;p=child;}heap[p]=node;position[node]=p;};
 for(let p=(length>>1)-1;p>=0;p--)siftDown(p);
 const east=new Float64Array(w.n),south=new Float64Array(w.n),N=w.size;
 for(let i=0;i<w.n;i++){if(i%N<N-1)east[i]=ground?Math.min(w.conduct[i],w.conduct[i+1]):Math.min(w.surfaceEast[i],w.surfaceWest[i+1]);if(i<w.n-N)south[i]=ground?Math.min(w.conduct[i],w.conduct[i+N]):Math.min(w.surfaceSouth[i],w.surfaceNorth[i+N]);}
 const offer=(i,next)=>{if(next<=1e-8||next<=current[i])return;current[i]=next;let p=position[i];if(p<0)p=length++;while(p){const parent=(p-1)>>1;if(current[heap[parent]]>=next)break;heap[p]=heap[parent];position[heap[p]]=p;p=parent;}heap[p]=i;position[i]=p;};
 while(length){const i=heap[0],value=current[i];position[i]=-1;length--;if(length){heap[0]=heap[length];position[heap[0]]=0;siftDown(0);}
  if(i%N)offer(i-1,value*.82*east[i-1]);if(i%N<N-1)offer(i+1,value*.82*east[i]);if(i>=N)offer(i-N,value*.82*south[i-N]);if(i<w.n-N)offer(i+N,value*.82*south[i]);
 }
 return {own,potential:current,east,south};
}
export function transportQi(w){
 const fields=[];for(const ground of [true,false]){
  const field=attractionField(w,ground);fields.push(field);const {potential,east,south}=field,stock=ground?w.ground:w.air,capacity=ground?w.capacity:w.airCapacity,delta=ground?w.gDelta:w.aDelta,speed=ground?w.config.groundDiffusion:w.config.surfaceDiffusion;
  const eastFlow=ground?w.groundEast:w.airEast,southFlow=ground?w.groundSouth:w.airSouth,out=ground?w.flows.groundOut:w.flows.surfaceOut,incoming=ground?w.flows.groundIn:w.flows.surfaceIn;
  const transfer=(i,j,pass,edge)=>{const difference=potential[j]-potential[i],a=difference>=0?i:j,b=a===i?j:i;
   const request=stock[a]*-Math.expm1(-Math.abs(difference)*pass*speed*w.config.dt);
   const q=Math.max(0,Math.min(request,stock[a]/8,(capacity[b]-stock[b])/8));edge[i]=a===i?q:-q;delta[a]-=q;delta[b]+=q;out[a]+=q;incoming[b]+=q;
  };
  for(let i=0;i<w.n;i++){if(i%w.size<w.size-1)transfer(i,i+1,east[i],eastFlow);if(i<w.n-w.size)transfer(i,i+w.size,south[i],southFlow);}
 }return fields;
}
export function observeQi(w){const weight=-Math.expm1(-w.config.dt/3);for(let i=0;i<w.n;i++){
 const source=(w.flows.geology[i]+w.flows.processing[i])/w.config.dt;
 const throughput=Math.min(w.flows.groundIn[i]+w.flows.surfaceIn[i],w.flows.groundOut[i]+w.flows.surfaceOut[i])/w.config.dt;
 const gathering=Math.max(0,w.flows.groundIn[i]+w.flows.surfaceIn[i]-w.flows.groundOut[i]-w.flows.surfaceOut[i])/w.config.dt;
 w.sourceMean[i]+=(source-w.sourceMean[i])*weight;w.throughputMean[i]+=(throughput-w.throughputMean[i])*weight;w.gatherMean[i]+=(gathering-w.gatherMean[i])*weight;
 }}

// Recompute only the part of the attraction field whose winning source can be this tree's cell.
export function withoutAncient(w,ground,field,k,details=false){
 const origin=k>>1,s=w.s(k),tree=w.ancients[k],free=clamp(1-w.qi[k]/Math.max(1e-9,w.mass[k]*s.capacity));
 const contribution=(ground?s.root:s.absorb)*tree.mass*free*w.suitability(origin,s,w.sun[origin]);
 if(!contribution||field.potential[origin]>field.own[origin]+1e-10)return details?{potential:field.potential,affected:[]}:field.potential;
 const adjacent=i=>[i%w.size?i-1:-1,i%w.size<w.size-1?i+1:-1,i>=w.size?i-w.size:-1,i<w.n-w.size?i+w.size:-1].filter(j=>j>=0);
 const factor=(i,j)=>.82*passage(w,Math.min(i,j),Math.max(i,j),ground);
 const affected=new Set([origin]),cells=[origin];
 for(let p=0;p<cells.length;p++){const i=cells[p];for(const j of adjacent(i))if(!affected.has(j)&&field.potential[i]*factor(i,j)>1e-8&&field.potential[i]*factor(i,j)>=field.potential[j]-1e-10){affected.add(j);cells.push(j);}}
 const result=field.potential.slice(),queue=[];
 for(const i of cells){result[i]=Math.max(0,field.own[i]-(i===origin?contribution:0));for(const j of adjacent(i))if(!affected.has(j))result[i]=Math.max(result[i],field.potential[j]*factor(i,j));queue.push([i,result[i]]);}
 for(let p=0;p<queue.length;p++){const [i,value]=queue[p];if(value<result[i])continue;for(const j of adjacent(i)){const v=value*factor(i,j);if(affected.has(j)&&v>result[j]+1e-12){result[j]=v;queue.push([j,v]);}}}
 return details?{potential:result,affected:cells}:result;
}
