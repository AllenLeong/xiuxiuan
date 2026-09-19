const clamp=v=>Math.max(0,Math.min(1,v));
export function gatheringDefaults(w,i){const affinity=Math.pow(w.fracture[i]*w.rock[i],3);return{rate:affinity*2,limit:2+affinity*120};}
function passage(w,i,j,ground){if(ground)return Math.min(w.conduct[i],w.conduct[j]);const horizontal=j===i+1;return Math.min(w[horizontal?'surfaceEast':'surfaceSouth'][i],w[horizontal?'surfaceWest':'surfaceNorth'][j]);}
export function attractionField(w,ground=false,excludeAncient=-1){
 const own=new Float64Array(w.n),potential=new Float64Array(w.n);
 for(let i=0;i<w.n;i++){
  const stock=ground?w.ground[i]:w.air[i],limit=ground?w.capacity[i]:w.gatherLimit[i];
  own[i]=(ground?w.groundGatherRate[i]:w.gatherRate[i])*clamp(1-stock/limit);
  for(let l=0;l<2;l++){const k=i*2+l;if(!w.count[k])continue;const s=w.s(k),free=clamp(1-w.qi[k]/Math.max(1e-9,w.mass[k]*s.capacity));
   const activeMass=w.mass[k]-(k===excludeAncient?(w.ancients[k]?.mass||0):0);own[i]+=(ground?s.root:s.absorb)*activeMass*free*w.suitability(i,s,w.sun[i]);
  }potential[i]=own[i];
 }
 // Propagate attraction through the best available path, attenuated at every edge.
 // Max-heap traversal avoids a grid-sized relaxation loop and permits long corridors.
 const heap=[];
 const push=(i,v)=>{let k=heap.length;heap.push([i,v]);while(k){const p=(k-1)>>1;if(heap[p][1]>=v)break;heap[k]=heap[p];k=p;}heap[k]=[i,v];};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let child=k*2+1;if(child+1<heap.length&&heap[child+1][1]>heap[child][1])child++;if(heap[child][1]<=last[1])break;heap[k]=heap[child];k=child;}heap[k]=last;}return top;};
 const current=potential;
 for(let i=0;i<w.n;i++)if(current[i]>1e-8)push(i,current[i]);
 while(heap.length){const [i,value]=pop();if(value<current[i])continue;
  for(const j of [i%w.size?i-1:-1,i%w.size<w.size-1?i+1:-1,i>=w.size?i-w.size:-1,i<w.n-w.size?i+w.size:-1]){
   if(j<0)continue;const next=value*.82*passage(w,Math.min(i,j),Math.max(i,j),ground);
   if(next>1e-8&&next>current[j]){current[j]=next;push(j,next);}
  }
 }
 return {own,potential:current};
}
export function transportQi(w){
 const fields=[];for(const ground of [true,false]){
  const field=attractionField(w,ground);fields.push(field);const {potential}=field,stock=ground?w.ground:w.air,capacity=ground?w.capacity:w.airCapacity,delta=ground?w.gDelta:w.aDelta,prefix=ground?'ground':'air',ledger=ground?'ground':'surface',speed=ground?w.config.groundDiffusion:w.config.surfaceDiffusion;
  for(let i=0;i<w.n;i++)for(const j of [i%w.size<w.size-1?i+1:-1,i<w.n-w.size?i+w.size:-1]){
   if(j<0)continue;const difference=potential[j]-potential[i],a=difference>=0?i:j,b=a===i?j:i,pass=passage(w,i,j,ground);
   const request=stock[a]*-Math.expm1(-Math.abs(difference)*pass*speed*w.config.dt);
   // Four neighbours share a snapshot supply and receiver space; neither can overspend.
   const q=Math.max(0,Math.min(request,stock[a]/8,(capacity[b]-stock[b])/8));
   w[prefix+(j===i+1?'East':'South')][i]=a===i?q:-q;
   delta[a]-=q;delta[b]+=q;w.flows[ledger+'Out'][a]+=q;w.flows[ledger+'In'][b]+=q;
  }
 }return fields;
}
export function observeQi(w){const weight=-Math.expm1(-w.config.dt/3);for(let i=0;i<w.n;i++){
 const source=(w.flows.geology[i]+w.flows.processing[i])/w.config.dt;
 const throughput=Math.min(w.flows.groundIn[i]+w.flows.surfaceIn[i],w.flows.groundOut[i]+w.flows.surfaceOut[i])/w.config.dt;
 const gathering=Math.max(0,w.flows.groundIn[i]+w.flows.surfaceIn[i]-w.flows.groundOut[i]-w.flows.surfaceOut[i])/w.config.dt;
 for(const [f,v]of [['sourceMean',source],['throughputMean',throughput],['gatherMean',gathering]])w[f][i]+=(v-w[f][i])*weight;
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
