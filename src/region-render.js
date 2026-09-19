import {regionRings} from './region-geometry.js';
import {significantRegions} from './regions.js';
import {RegionPathCache} from './region-path-cache.js';
const plateauBounds=new WeakMap();
const cache=new WeakMap(),footprints=new RegionPathCache();
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
  const chosen=r.cells.includes(selected);if(!data.paths.has(r.id))data.paths.set(r.id,footprints.get(r,state.size,boundary));
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

// Plateau landforms have broad flat tops. Their footprint is geographic and
// independent of zoom; edge shading is a terrain cue, not a province border.
export function drawPlateaus(c,state,z){
 const items=state.regions?.items?.filter(r=>r.kind==='plateau'&&r.status!=='candidate')||[];
 if(!items.length)return;
 c.save();const unit=state.size/256;
 for(const r of items){
  const path=footprints.get(r,state.size,boundary);
  c.fillStyle='#d5c4a32b';c.fill(path,'evenodd');
  c.save();c.translate(unit*.7,unit*.9);c.strokeStyle='#43504465';c.lineWidth=unit*1.4;c.stroke(path);c.restore();
  c.strokeStyle='#e6dfb78c';c.lineWidth=unit*.6;c.stroke(path);
  // Sparse horizontal bedding makes the top read as a surface, not a peak.
  c.save();c.clip(path,'evenodd');c.strokeStyle='#7d745329';c.lineWidth=.6/z;
  const spacing=Math.max(8*unit,8/z);
  let bounds=plateauBounds.get(r.cells);
  if(!bounds){bounds={minX:state.size,maxX:0,minY:state.size,maxY:0};for(const i of r.cells){const x=i%state.size,y=Math.floor(i/state.size);bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);bounds.minY=Math.min(bounds.minY,y);bounds.maxY=Math.max(bounds.maxY,y);}plateauBounds.set(r.cells,bounds);}
  const {minX,maxX,minY,maxY}=bounds;
  for(let y=Math.floor(minY/spacing)*spacing;y<=maxY;y+=spacing){c.beginPath();for(let x=minX;x<maxX;x+=spacing*2){c.moveTo(x,y);c.quadraticCurveTo(x+spacing*.4,y-unit*.5,x+spacing*.85,y);}c.stroke();}
  c.restore();
 }
 c.restore();
}
