// Geometry depends on the static snapshot, never on the camera or ecology tick.
const cache=new WeakMap();
export function boundaryGeometry(map,size,{contours=false,borders=false}={}){
 const groups=new Map();
 function edge(i,j,x,y,vertical){
  let color=null,width=.55;
  
  if((map.height[i]<.23)!==(map.height[j]<.23))color='#4d6559dd';
  if(borders&&map.height[i]>=.23&&map.height[j]>=.23&&map.province[i]!==map.province[j])color='#66492fe8';
  if(!color)return;
  if(borders&&map.province[i]!==map.province[j])width=1.25;
  const key=color+':'+width;
  if(!groups.has(key))groups.set(key,{color,width,segments:[]});
  groups.get(key).segments.push(vertical?[x+1,y,x+1,y+1]:[x,y+1,x+1,y+1]);
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=y*size+x;if(x+1<size)edge(i,i+1,x,y,true);if(y+1<size)edge(i,i+size,x,y,false);
 }
 if(contours){
  // Marching squares: contours intersect cell centres at the actual height,
  // rather than outlining quantized grid cells. Levels stay fixed at every zoom.
  for(const level of [.38,.48,.58,.68,.78,.88,.98]){
   const segments=[];
   for(let y=0;y<size-1;y++)for(let x=0;x<size-1;x++){
    const i=y*size+x,values=[map.height[i],map.height[i+1],map.height[i+size+1],map.height[i+size]],points=[[x+.5,y+.5],[x+1.5,y+.5],[x+1.5,y+1.5],[x+.5,y+1.5]],hits=[];
    for(let k=0;k<4;k++){
     const j=(k+1)%4,a=values[k],b=values[j];
     if((a>=level)===(b>=level))continue;
     const t=(level-a)/(b-a);hits.push([points[k][0]+t*(points[j][0]-points[k][0]),points[k][1]+t*(points[j][1]-points[k][1])]);
    }
    if(hits.length===2)segments.push([...hits[0],...hits[1]]);
    else if(hits.length===4){
     const above=values.reduce((a,b)=>a+b,0)/4>=level;
     const pairs=above===(values[0]>=level)?[[0,1],[2,3]]:[[0,3],[1,2]];
     for(const [a,b]of pairs)segments.push([...hits[a],...hits[b]]);
    }
   }
   if(segments.length)groups.set('contour'+level,{color:level>=.68?'#46574755':'#62583730',width:level===.68||level===.88?.8:.45,segments});
  }
 }
 return [...groups.values()];
}
export function boundaryPaths(map,size,options,Path=Path2D){
 let saved=cache.get(map.height);
 if(!saved||saved.province!==map.province||saved.size!==size){saved={province:map.province,size,variants:new Map()};cache.set(map.height,saved);}
 const key=String(!!options.contours)+':'+String(!!options.borders);
 if(!saved.variants.has(key))saved.variants.set(key,boundaryGeometry(map,size,options).map(({segments,...style})=>{
  const path=new Path();for(const [x,y,u,v]of segments){path.moveTo(x,y);path.lineTo(u,v);}return {...style,path};
 }));
 return saved.variants.get(key);
}
