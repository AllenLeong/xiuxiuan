import {flowRoutes,qiGatherings} from './flow-routes.js';
const cache=new WeakMap();
export function drawQiFlow(c,state,{x0,x1,y0,y1,z}){
 const n=state.size;
 let data=cache.get(state);if(!data){data={ground:flowRoutes(state,'ground'),air:flowRoutes(state,'air'),hubs:qiGatherings(state)};cache.set(state,data);}
 c.save();c.beginPath();c.rect(0,0,n,n);c.clip();c.fillStyle='#11272060';c.fillRect(x0,y0,x1-x0,y1-y0);
 for(const [key,color]of [['ground','#ebc580'],['air','#7ee8de']])for(const route of data[key].routes){
  const points=route.points;
  if(!points.some(([x,y])=>x>=x0&&x<=x1&&y>=y0&&y<=y1))continue;
  // Dense integrated samples already curve; Bézier smoothing could cross a wall.
  const trace=()=>{c.beginPath();c.moveTo(...points[0]);for(let j=1;j<points.length;j++)c.lineTo(...points[j]);};
  c.lineJoin=c.lineCap='round';c.strokeStyle=color;c.globalAlpha=.35+Math.min(.5,route.strength*4);c.lineWidth=(.7+1.3*Math.min(1,Math.log1p(route.strength)/Math.log(11)))/z;trace();c.stroke();c.globalAlpha=.95;
  for(let j=8;j<points.length;j+=Math.max(12,Math.round(210/z))){const p=points[Math.max(0,j-1)],q=points[j],angle=Math.atan2(q[1]-p[1],q[0]-p[0]),head=3/z;
  c.beginPath();c.moveTo(q[0]-Math.cos(angle-.6)*head,q[1]-Math.sin(angle-.6)*head);c.lineTo(...q);c.lineTo(q[0]-Math.cos(angle+.6)*head,q[1]-Math.sin(angle+.6)*head);c.stroke();}c.globalAlpha=1;
 }
 // Storage markers are independent of flow: a busy route need not store much.
 for(const p of data.hubs){const x=p.i%n+.5,y=Math.floor(p.i/n)+.5,r=Math.min(15,6+Math.log1p(p.score)*3)/z;const glow=c.createRadialGradient(x,y,0,x,y,r*2);glow.addColorStop(0,p.air>=12?'#a3f0d85c':'#efd2965c');glow.addColorStop(1,'#dfdbab00');c.fillStyle=glow;c.beginPath();c.arc(x,y,r*2,0,Math.PI*2);c.fill();}
 c.restore();
}
