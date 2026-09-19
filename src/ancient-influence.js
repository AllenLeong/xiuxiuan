import {attractionField,withoutAncient} from './qi-transport.js';
const clamp=v=>Math.max(0,Math.min(1,v));
// A path-mediated canopy effect used by the simulation, not a decorative radius.
export function ancientMicroclimate(w){
 const cover=new Float64Array(w.n),sources=[],reaches=[];
 for(const [key,tree]of Object.entries(w.ancients)){
  const k=Number(key),origin=k>>1,s=w.s(k),id=tree.id??`${k}@${(w.year-tree.age).toFixed(4)}`;tree.id=id;
  const strength=clamp(tree.mass*s.size*s.shade/10),reach=new Map([[origin,strength]]),queue=[[origin,strength]];
  for(let p=0;p<queue.length;p++){
   const [i,value]=queue[p];if(value<reach.get(i))continue;
   const x=i%w.size;
   for(const [j,out,into]of [[x?i-1:-1,'surfaceWest','surfaceEast'],[x<w.size-1?i+1:-1,'surfaceEast','surfaceWest'],[i>=w.size?i-w.size:-1,'surfaceNorth','surfaceSouth'],[i<w.n-w.size?i+w.size:-1,'surfaceSouth','surfaceNorth']]){
    if(j<0||w.height[j]<.23||w.lakeDepth[j]>.012)continue;
    const v=value*.7*Math.min(w[out][i],w[into][j]);
    if(v>=.04&&v>(reach.get(j)||0)){reach.set(j,v);queue.push([j,v]);}
   }
  }
  for(const [i,v]of reach)cover[i]=Math.max(cover[i],v);
  sources.push({id,origin,cells:[]});reaches.push(reach);
 }
 for(let a=0;a<sources.length;a++)for(const [i,v]of reaches[a]){
  const k=i*2+1,s=w.count[k]?w.s(k):null,local=s?clamp(w.mass[k]*s.size*s.shade/10):0;
  let without=s?clamp((w.mass[k]-(sources[a].origin===i?w.ancients[k].mass:0))*s.size*s.shade/10):0;
  for(let b=0;b<sources.length;b++)if(b!==a)without=Math.max(without,reaches[b].get(i)||0);
  if((Math.max(local,cover[i])-without)*w.config.feedback>=.08)sources[a].cells.push(i);
 }
 return{cover,sources};
}
export function observeAncients(w,micro,fields=null){
 const items=micro.sources.map(s=>({...s,kind:'nourishment'}));
 if(!micro.sources.length)return items;
 fields??=[attractionField(w,true),attractionField(w,false)];
 for(const source of micro.sources){const k=source.origin*2+1,cells=new Set();
  for(const [layer,ground]of [true,false].entries()){
   const all=fields[layer].potential,{potential:without,affected}=withoutAncient(w,ground,fields[layer],k,true),prefix=ground?'ground':'air',edges=new Set();
   for(const i of affected){if(i%w.size<w.size-1)edges.add(i*2);if(i<w.n-w.size)edges.add(i*2+1);if(i%w.size)edges.add((i-1)*2);if(i>=w.size)edges.add((i-w.size)*2+1);}
   for(const edge of edges){const i=edge>>1,j=i+(edge%2?w.size:1);
    if(j<0)continue;const q=w[prefix+(j===i+1?'East':'South')][i],a=q>=0?i:j,b=a===i?j:i;
    // Real flow AND a positive marginal contribution by this individual tree.
    if(Math.abs(q)/w.config.dt>=.02&&all[b]-all[a]-(without[b]-without[a])>.01){cells.add(a);cells.add(b);}
   }
  }items.push({id:source.id,origin:source.origin,kind:'ancientDraw',cells:[...cells]});
 }return items;
}
