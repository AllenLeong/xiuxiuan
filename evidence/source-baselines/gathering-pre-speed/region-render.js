import {regionRings} from './region-geometry.js';
import {significantRegions} from './regions.js';
const cache=new WeakMap();
function boundary(region,n){
 const path=new Path2D();
 for(const ring of regionRings(region.cells,n)){
  // Rounded corners stay within half a cell; no convex hull or fabricated bridge.
  const last=ring.at(-1),first=ring[0];path.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
  for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];path.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2);}path.closePath();
 }return path;
}
export function drawRegions(c,state,mode,z,selected){
 if(mode==='off'||!state.regions)return;
 let data=cache.get(state.regions);if(!data){data={composites:null,paths:new Map()};cache.set(state.regions,data);}
 const visible=mode==='significant'?(data.composites??=significantRegions(state.regions)):state.regions.items.filter(r=>r.status!=='candidate'&&(mode==='thermal'?['thermal','geothermal'].includes(r.dimension):r.dimension===mode));
 c.save();const labels=[];
 for(const r of visible){
  const chosen=r.cells.includes(selected);if(!data.paths.has(r.id))data.paths.set(r.id,boundary(r,state.size));
  // Shade exact member cells, not a convex hull: lakes and clearings remain holes.
  c.fillStyle=r.color+(chosen?'80':'48');c.fill(data.paths.get(r.id),'evenodd');
  // Colour fields carry the default view. Only the selected footprint gets an outline.
  if(chosen){c.setLineDash(r.status==='fading'?[4/z,3/z]:[]);c.lineJoin='round';c.strokeStyle='#f3e5b6';c.lineWidth=1.5/z;c.stroke(data.paths.get(r.id));}
  const x=r.core%state.size+.5,y=Math.floor(r.core/state.size)+.5;
  if(labels.length>=12||labels.some(p=>Math.abs(p.x-x)*z<110&&Math.abs(p.y-y)*z<28))continue;labels.push({x,y});
  c.font=`${11/z}px "Songti SC",serif`;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3/z;c.strokeStyle='#e3ddc3dd';c.setLineDash([]);c.strokeText(r.label,x,y);c.fillStyle='#294238';c.fillText(r.label,x,y);
 }
 c.restore();
}
