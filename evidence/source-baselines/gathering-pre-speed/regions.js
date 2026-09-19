import {regionalClasses} from './region-geometry.js';
import {landformAt} from './landforms.js';
// Observational regions never feed back into qi, growth, random numbers or geography.
const KINDS={nourishment:{dimension:'ancient',label:'古树滋养范围',color:'#96b979'},ancientDraw:{dimension:'ancient',label:'古树牵引范围',color:'#75b5c3'},production:{dimension:'qi',label:'灵气生产区',color:'#c6a46b'},gathering:{dimension:'qi',label:'持续聚气区',color:'#7dbcb2'},transport:{dimension:'qi',label:'灵气输送带',color:'#9cabd0'},cold:{dimension:'thermal',label:'寒冷地带',color:'#b8d7db'},hot:{dimension:'thermal',label:'炎热地带',color:'#d39b70'},geothermal:{dimension:'geothermal',label:'地热地带',color:'#d07e57'},dry:{dimension:'moisture',label:'干旱地带',color:'#bfa86b'},wet:{dimension:'moisture',label:'湿润地带',color:'#79a8aa'},forest:{dimension:'forest',label:'连片林区',color:'#608967'},mountain:{dimension:'landform',label:'山地',color:'#aeaaa0'},plateau:{dimension:'landform',label:'高原',color:'#aaa17a'},basin:{dimension:'landform',label:'盆地',color:'#a6b47f'},plain:{dimension:'landform',label:'平原',color:'#a6b47f'},hills:{dimension:'landform',label:'丘陵',color:'#b5a284'},valley:{dimension:'landform',label:'河谷',color:'#7eaaa1'},gorge:{dimension:'landform',label:'峡谷',color:'#9aa298'},coast:{dimension:'landform',label:'海岸低地',color:'#b0b89d'}};
export const REGION_KINDS=KINDS;
const terrainCache=new WeakMap();
const LEGACY_KINDS={highland:{dimension:'landform',color:'#aeaaa0'},lowland:{dimension:'landform',color:'#a6b47f'}};
function neighbors(i,n){return[i%n?i-1:-1,i%n<n-1?i+1:-1,i>=n?i-n:-1,i<n*(n-1)?i+n:-1].filter(j=>j>=0);}
function flags(w,kind,old,terrain){const out=new Uint8Array(w.n);for(let i=0;i<w.n;i++){
 if(w.height[i]<.23||w.lakeDepth[i]>.012)continue;
 const k=i*2+1,s=w.species[w.type[k]],cover=w.count[k]&&s?Math.min(1,w.mass[k]*s.size/10):0;
 out[i]=kind==='production'?(w.sourceMean?.[i]||0)>=.3:kind==='gathering'?(w.gatherMean?.[i]||0)>=.15:kind==='transport'?(w.throughputMean?.[i]||0)>=.08:kind==='cold'?w.temp[i]<=5:kind==='hot'?w.temp[i]>=32:kind==='geothermal'?w.heat[i]>=10:kind==='dry'?w.water[i]<=.22:kind==='wet'?w.water[i]>=.68:KINDS[kind].dimension==='landform'?terrain[i]===KINDS[kind].label:cover>=(old[i]&&old[i].status!=='candidate'?.25:.35);
 }return kind==='forest'?regionalClasses(out,Uint8Array.from(w.height,(h,i)=>h>=.23&&w.lakeDepth[i]<=.012),w.size,2,7):out;}
function components(mask,n,minArea,requireWidth=true){const visited=new Uint8Array(n*n),out=[];for(let start=0;start<mask.length;start++){
 if(!mask[start]||visited[start])continue;const cells=[start];visited[start]=1;let width=false;
 for(let p=0;p<cells.length;p++){const i=cells[p],x=i%n,y=Math.floor(i/n);if(x>0&&y>0&&x<n-1&&y<n-1){let full=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!mask[i+dy*n+dx])full=false;width ||= full;}
  for(const j of neighbors(i,n))if(mask[j]&&!visited[j]){visited[j]=1;cells.push(j);}}
 if(cells.length>=minArea&&(!requireWidth||width))out.push(cells);
 }return out.sort((a,b)=>b.length-a.length||a[0]-b[0]);}
function metrics(w,cells){let temperature=0,water=0,height=0,trees=0,spiritTrees=0,ancients=0,cx=0,cy=0;const species={};
 for(const i of cells){temperature+=w.temp[i];water+=w.water[i];height+=w.height[i];cx+=i%w.size+.5;cy+=Math.floor(i/w.size)+.5;const k=i*2+1;trees+=w.count[k];if(w.type[k]>=0)species[w.type[k]]=(species[w.type[k]]||0)+w.count[k];if(w.species[w.type[k]]?.spirit)spiritTrees+=w.count[k];if(w.ancients[k])ancients++;}
 const area=cells.length;cx/=area;cy/=area;const core=cells.reduce((best,i)=>Math.hypot(i%w.size+.5-cx,Math.floor(i/w.size)+.5-cy)<Math.hypot(best%w.size+.5-cx,Math.floor(best/w.size)+.5-cy)?i:best,cells[0]);
 const qiRates={production:0,gathering:0,transport:0};for(const i of cells){qiRates.production+=w.sourceMean?.[i]||0;qiRates.gathering+=w.gatherMean?.[i]||0;qiRates.transport+=w.throughputMean?.[i]||0;}return{qiRates,area,temperature:temperature/area,water:water/area,height:height/area,trees,spiritTrees,ancients,core,dominant:Number(Object.entries(species).sort((a,b)=>b[1]-a[1])[0]?.[0]??-1)};
}
export function updateRegions(w,initial=false){
 const previous=w.regions||{version:1,nextId:1,year:w.year,items:[]},elapsed=Math.max(0,w.year-previous.year);
 if(!initial&&elapsed<1-1e-8)return previous;
 let geography=terrainCache.get(w);if(initial||!geography){const land=Uint8Array.from(w.height,(h,i)=>h>=.23&&w.lakeDepth[i]<=.012);geography=regionalClasses(Array.from({length:w.n},(_,i)=>landformAt(w,i)),land,w.size,3);terrainCache.set(w,geography);}const items=[],used=new Set(),terrain=geography;let nextId=previous.nextId;
 const definitions=Object.keys(KINDS).filter(kind=>KINDS[kind].dimension!=='ancient').map(kind=>({kind}));for(const influence of w.ancientInfluences||[])definitions.push({kind:influence.kind,influence});
 for(const {kind,influence} of definitions){
  const influenceMask=influence?new Uint8Array(w.n):null;if(influence)for(const i of influence.cells)influenceMask[i]=1;
  const old=new Array(w.n);for(const r of previous.items)if(r.kind===kind&&r.sourceId===influence?.id)for(const i of r.cells)old[i]=r;
  for(const cells of components(influenceMask||flags(w,kind,old,terrain),w.size,influence?9:kind==='forest'?24:KINDS[kind].dimension==='qi'?12:48,!['transport','ancientDraw'].includes(kind))){
   const overlaps=new Map();for(const i of cells)if(old[i])overlaps.set(old[i],(overlaps.get(old[i])||0)+1);
   const matches=[...overlaps].filter(([r,count])=>count/Math.min(cells.length,r.cells.length)>=.25).sort((a,b)=>b[1]-a[1]||a[0].id-b[0].id);
   const match=matches.find(([r])=>!used.has(r.id))?.[0];if(match)used.add(match.id);for(const [r,count]of matches)if(count/r.cells.length>=.5)used.add(r.id);
   const stableYears=match?match.stableYears+elapsed:0,established=initial||stableYears>=5||(match&&match.status!=='candidate');
   const m=metrics(w,cells);
   items.push({...(influence?{sourceId:influence.id,sourceCell:influence.origin}:{}),id:match?.id??nextId++,kind,dimension:KINDS[kind].dimension,label:kind==='forest'&&m.dominant>=0?`${w.species[m.dominant].name}林区`:KINDS[kind].label,color:KINDS[kind].color,cells,...m,stableYears,firstObserved:match?.firstObserved??w.year,formed:match&&match.status!=='candidate'?match.formed:(initial?null:established?w.year:null),status:established?(initial?'initial':'established'):'candidate',missingYears:0,parents:[...new Set([...(match?.parents||[]),...matches.filter(([r])=>r.id!==match?.id).map(([r])=>r.id)])]});
  }
 }
 for(const r of previous.items)if(!used.has(r.id)&&r.status!=='candidate'&&r.missingYears+elapsed<5)items.push({...r,status:'fading',missingYears:r.missingYears+elapsed});
 return{version:1,size:w.size,nextId,year:w.year,items};
}
export function restoreRegions(w,saved){
 if(!saved)return updateRegions(w,true);
 if(saved.version!==1||!Number.isInteger(saved.nextId)||saved.nextId<1||!Number.isFinite(saved.year)||saved.year>w.year||!Array.isArray(saved.items)||saved.items.length>w.n)throw Error('区域存档无效');
 let total=0;const ids=new Set();for(const r of saved.items){const definition=KINDS[r.kind]||LEGACY_KINDS[r.kind];total+=r.cells?.length||0;if(r.dimension==='ancient'&&(typeof r.sourceId!=='string'||r.sourceId.length>80||!Number.isInteger(r.sourceCell)||r.sourceCell<0||r.sourceCell>=w.n))throw Error('古树作用来源无效');if(!definition||r.dimension!==definition.dimension||typeof r.label!=='string'||r.label.length>80||r.color!==definition.color||!Number.isInteger(r.id)||r.id<1||r.id>=saved.nextId||ids.has(r.id)||!Array.isArray(r.cells)||!r.cells.length||r.cells.some(i=>!Number.isInteger(i)||i<0||i>=w.n)||new Set(r.cells).size!==r.cells.length||!r.cells.includes(r.core)||!['candidate','initial','established','fading'].includes(r.status)||!['stableYears','missingYears','firstObserved','area','trees','spiritTrees','ancients','water'].every(k=>Number.isFinite(r[k])&&r[k]>=0)||!Number.isFinite(r.temperature)||!Number.isFinite(r.height)||r.area!==r.cells.length||r.firstObserved>w.year||(r.formed!==null&&(!Number.isFinite(r.formed)||r.formed>w.year))||!Array.isArray(r.parents)||r.parents.some(id=>!Number.isInteger(id)||id<1))throw Error('区域记录无效');ids.add(r.id);}
 if(total>w.n*Object.keys(KINDS).length*2)throw Error('区域记录超限');return {...structuredClone(saved),size:w.size};
}
export function regionsAt(regions,i){return(regions?.items||[]).filter(r=>r.status!=='candidate'&&r.cells.includes(i)).map(({cells,...r})=>r);}
export function significantRegions(regions){
 const active=(regions?.items||[]).filter(r=>r.status!=='candidate'&&r.status!=='fading');
 // Intersect actual footprints. An immense ordinary forest must not inherit a tiny hot spring's significance.
 const coverage=new Map();for(const r of active)for(const i of r.cells){if(!coverage.has(i))coverage.set(i,[]);coverage.get(i).push(r);}
 const groups=new Map();for(const [i,at]of coverage){
  const dimensions=new Set(at.map(r=>r.dimension));
  const distinctive=at.some(r=>['thermal','geothermal','qi','ancient'].includes(r.dimension))||(dimensions.has('forest')&&dimensions.has('moisture'));
  if(!distinctive||dimensions.size<2||!at.some(r=>['forest','landform','qi','ancient'].includes(r.dimension)))continue;
  const key=at.map(r=>r.id).sort((a,b)=>a-b).join('-');if(!groups.has(key))groups.set(key,{at,cells:[]});groups.get(key).cells.push(i);
 }
 const out=[];const n=regions.size;if(!n)return out;
 for(const [key,{at,cells}]of groups){
  const mask=new Uint8Array(n*n);for(const i of cells)mask[i]=1;
  for(const piece of components(mask,n,24)){
   const forest=at.find(r=>r.dimension==='forest'),terrain=at.find(r=>r.dimension==='landform'),special=at.find(r=>r.dimension==='ancient')||at.find(r=>r.dimension==='qi')||at.find(r=>r.dimension==='geothermal')||at.find(r=>r.dimension==='thermal')||forest;
   const qualifier=at.some(r=>r.kind==='cold')?'寒冷':at.some(r=>r.kind==='hot')?'炎热':at.some(r=>r.kind==='geothermal')?'地热':at.some(r=>r.kind==='dry')?'干旱':at.some(r=>r.kind==='wet')?'湿润':'';
   const label=['qi','ancient'].includes(special.dimension)?special.label+(forest?' · 林地':''):qualifier+(forest?'林区':terrain?.label||'地带');
   let cx=0,cy=0;for(const i of piece){cx+=i%n;cy+=(i/n)|0;}cx/=piece.length;cy/=piece.length;
   const core=piece.reduce((best,i)=>Math.hypot(i%n-cx,((i/n)|0)-cy)<Math.hypot(best%n-cx,((best/n)|0)-cy)?i:best,piece[0]);
   out.push({...special,id:'composite-'+key+'-'+piece[0],cells:piece,area:piece.length,core,label,links:at.map(r=>({id:r.id,kind:r.kind,label:r.label,overlap:piece.length})),significance:at.length});
  }
 }return out.sort((a,b)=>b.significance-a.significance||b.area-a.area);
}
