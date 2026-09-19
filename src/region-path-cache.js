// Region metrics change every year even when their exact footprint does not.
// Keep a bounded set of immutable footprints; never reuse a path on ID alone.
export class RegionPathCache {
 constructor(limit=256){this.limit=limit;this.entries=new Map();}
 get(region,size,build){
  const key=size+':'+region.id,old=this.entries.get(key),cells=region.cells;
  if(old&&old.cells.length===cells.length&&old.cells.every((v,i)=>v===cells[i])){
   this.entries.delete(key);this.entries.set(key,old);return old.path;
  }
  const path=build(region,size);this.entries.delete(key);this.entries.set(key,{cells:cells.slice(),path});
  while(this.entries.size>this.limit)this.entries.delete(this.entries.keys().next().value);
  return path;
 }
}
