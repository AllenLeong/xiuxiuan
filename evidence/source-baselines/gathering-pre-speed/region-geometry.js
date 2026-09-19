// Region scale classification. Tiny clearings remain inspectable cells; open water is a hard boundary.
export function regionalClasses(values,land,n,passes=2,majority=5){
 let result=values.slice();
 for(let p=0;p<passes;p++){
  const next=result.slice();
  for(let i=0;i<result.length;i++){
   if(!land[i])continue;
   const x=i%n,y=(i/n)|0,votes=new Map();
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||xx>=n||yy<0||yy>=n)continue;
    const j=yy*n+xx;if(!land[j])continue;
    votes.set(result[j],(votes.get(result[j])||0)+1);
   }
   let best=result[i],count=votes.get(best)||0;
   for(const [value,total] of votes)if(total>count){best=value;count=total;}
   // Absolute majority prevents ambiguous edges from moving on every refresh.
   if(count>=majority)next[i]=best;
  }result=next;
 }return result;
}
// Trace closed rings, including real holes. At diagonal contacts keep separate components.
export function regionRings(cells,n){
 const members=new Set(cells),edges=[],outgoing=new Map();
 const add=(x,y,xx,yy,dir)=>{const e={a:[x,y],b:[xx,yy],dir};edges.push(e);const key=y*(n+1)+x;if(!outgoing.has(key))outgoing.set(key,[]);outgoing.get(key).push(e);};
 for(const i of cells){const x=i%n,y=(i/n)|0;
  if(y===0||!members.has(i-n))add(x,y,x+1,y,0);
  if(x===n-1||!members.has(i+1))add(x+1,y,x+1,y+1,1);
  if(y===n-1||!members.has(i+n))add(x+1,y+1,x,y+1,2);
  if(x===0||!members.has(i-1))add(x,y+1,x,y,3);
 }
 const seen=new Set(),rings=[];
 for(const start of edges){if(seen.has(start))continue;const ring=[];let edge=start;
  while(edge&&!seen.has(edge)){seen.add(edge);ring.push(edge.a);const candidates=outgoing.get(edge.b[1]*(n+1)+edge.b[0])||[];
   edge=[1,0,3,2].flatMap(turn=>candidates.filter(e=>!seen.has(e)&&(e.dir-edge.dir+4)%4===turn))[0];
  }
  if(ring.length>=4)rings.push(ring);
 }return rings;
}
