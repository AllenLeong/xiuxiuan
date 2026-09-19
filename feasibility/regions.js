import {PLANTS} from './model.js';
import {temperatureBand,terrainType,surfaceType} from './ecology.js';
export const DIMENSIONS={temperature:'温度片区',forest:'林区',terrain:'地形片区',qi:'灵气特点',composite:'综合片区'};
export function cellTraits(s,i){
 const land=s.elevation[i]>.205&&s.lake[i]<.009,k=i*2+1,p=PLANTS[s.type[k]],forest=land&&p&&s.mass[k]>.65?(p.capacity?'灵木林':p.name+'林'):'疏林 / 无林';
 const production=(s.source[i]||0)+(s.processing[i]||0),flow=Math.hypot(s.flowX[i]||0,s.flowY[i]||0);
 const qi=!land?'普通':production>.15?'生产区':s.air[i]>2&&s.retention[i]>.36?'聚气区':flow>.06?'输送带':s.qi[k]>35?'植内蓄灵区':'普通';
 return {temperature:temperatureBand(s.temp[i]),forest,terrain:terrainType(s,i),qi,surface:surfaceType(s,i)};
}
// Four-neighbour connected support; no radius circles or overlapping bounding boxes.
export function identifyRegions(s){
 const n=s.width*s.height,w=s.width,traits=Array.from({length:n},(_,i)=>cellTraits(s,i));
 const result={};
 for(const dimension of Object.keys(DIMENSIONS)){
  const ids=new Int32Array(n).fill(-1),seen=new Uint8Array(n),regions=[];
  const key=i=>{const t=traits[i];if(t.terrain==='海域'||t.terrain==='湖泊')return '';
   if(dimension==='forest')return t.forest==='疏林 / 无林'?'':t.forest;
   if(dimension==='qi')return t.qi==='普通'?'':t.qi;
   if(dimension==='composite'){
    const special=(t.temperature==='极寒'||t.temperature==='极热'?1:0)+(t.forest!=='疏林 / 无林'?1:0)+(t.terrain!=='平原'?1:0)+(t.qi!=='普通'?1:0);
    return special>=2?[t.temperature,t.forest,t.terrain,t.qi].join(' · '):'';
   }return t[dimension];
  };
  const keys=Array.from({length:n},(_,i)=>key(i)),minimum=dimension==='composite'?96:dimension==='qi'?20:64;
  for(let i=0;i<n;i++){if(seen[i]||!keys[i])continue;const cells=[i],label=keys[i];seen[i]=1;
   for(let k=0;k<cells.length;k++){const a=cells[k],x=a%w;for(const b of [x?a-1:-1,x<w-1?a+1:-1,a>=w?a-w:-1,a<n-w?a+w:-1])if(b>=0&&!seen[b]&&keys[b]===label){seen[b]=1;cells.push(b);}}
   if(cells.length<minimum)continue;
   let temp=0,air=0,plant=0,cx=0,cy=0;const id=regions.length,edges=[];
   for(const a of cells){ids[a]=id;temp+=s.temp[a];air+=s.air[a];plant+=s.qi[a*2]+s.qi[a*2+1];cx+=a%w;cy+=Math.floor(a/w);}
   const area=cells.length;regions.push({id,label,cells,edges,area,cx:cx/area,cy:cy/area,temp:temp/area,air:air/area,plant:plant/area});
  }
  for(const r of regions)for(const a of r.cells){const x=a%w,y=Math.floor(a/w);if(x===0||ids[a-1]!==r.id)r.edges.push([x,y,x,y+1]);if(x===w-1||ids[a+1]!==r.id)r.edges.push([x+1,y,x+1,y+1]);if(y===0||ids[a-w]!==r.id)r.edges.push([x,y,x+1,y]);if(y===s.height-1||ids[a+w]!==r.id)r.edges.push([x,y+1,x+1,y+1]);}
  result[dimension]={ids,regions,minimum};
 }
 return result;
}
