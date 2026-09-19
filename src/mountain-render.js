// Mountain positions and silhouettes live in world coordinates, independent of zoom.
const cache=new WeakMap();
export function mountainGeometry(m,n){
 const saved=cache.get(m.height);
 if(saved?.n===n&&saved.river===m.river&&saved.lake===m.lakeDepth)return saved.peaks;
 const step=Math.max(6,Math.round(n*.036)),peaks=[];
 for(let gy=0;gy<n;gy+=step)for(let gx=0;gx<n;gx+=step){
  let best=-1,height=.64;
  for(let y=gy;y<Math.min(n,gy+step);y++)for(let x=gx;x<Math.min(n,gx+step);x++){
   const i=y*n+x;if(m.height[i]>height&&m.river[i]<.35&&(m.lakeDepth?.[i]||0)<=.012){height=m.height[i];best=i;}
  }
  if(best<0)continue;
  const bx=best%n,by=Math.floor(best/n),radius=Math.max(2,Math.round(n*.008));let low=height;
  for(const [dx,dy]of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){
   const xx=Math.max(0,Math.min(n-1,bx+dx)),yy=Math.max(0,Math.min(n-1,by+dy));low=Math.min(low,m.height[yy*n+xx]);
  }
  const relief=height-low;if(relief<.023)continue;
  const importance=Math.max(0,Math.min(1,(height-.64)*1.7+relief*2.4)),seed=(best*31>>>0)%97;
  // Template units are converted once to map units; the camera scales everything together.
  const width=22*(.52+importance*.53),peak=width*(.48+importance*.50+(seed%7)*.025);
  peaks.push({x:bx+.5,y:by+.5,width,peak,height,unit:n/600});
 }
 cache.set(m.height,{n,river:m.river,lake:m.lakeDepth,peaks});return peaks;
}
export function drawMountains(c,m,n,{x0,x1,y0,y1}){
 for(const {x,y,width,peak,height,unit}of mountainGeometry(m,n)){
  if(x+width*.66*unit<x0||x-width*.64*unit>x1||y+5*unit<y0||y-peak*unit>y1)continue;
  c.save();c.translate(x,y);c.scale(unit,unit);
  // A sloping shoulder and unequal side peak replace repeated triangles.
  const wash=c.createLinearGradient(0,-peak,0,5);wash.addColorStop(0,'#c7cbb8');wash.addColorStop(.65,'#879781df');wash.addColorStop(1,'#87978100');
  c.fillStyle=wash;c.beginPath();c.moveTo(-width*.64,4);c.bezierCurveTo(-width*.46,-peak*.08,-width*.34,-peak*.44,-width*.20,-peak*.50);c.bezierCurveTo(-width*.12,-peak*.60,-width*.08,-peak*.98,0,-peak);c.bezierCurveTo(width*.10,-peak*.86,width*.13,-peak*.45,width*.24,-peak*.36);c.bezierCurveTo(width*.29,-peak*.49,width*.31,-peak*.64,width*.36,-peak*.61);c.bezierCurveTo(width*.45,-peak*.38,width*.49,-peak*.13,width*.66,4);c.closePath();c.fill();
  c.strokeStyle='#354b40c0';c.lineWidth=.85;c.beginPath();c.moveTo(-width*.64,3);c.bezierCurveTo(-width*.43,-peak*.09,-width*.36,-peak*.43,-width*.20,-peak*.50);c.bezierCurveTo(-width*.12,-peak*.60,-width*.08,-peak*.98,0,-peak);c.bezierCurveTo(width*.10,-peak*.86,width*.13,-peak*.45,width*.24,-peak*.36);c.bezierCurveTo(width*.29,-peak*.49,width*.31,-peak*.64,width*.36,-peak*.61);c.bezierCurveTo(width*.45,-peak*.38,width*.49,-peak*.13,width*.66,3);c.stroke();
  c.fillStyle='#324c4145';c.beginPath();c.moveTo(0,-peak);c.bezierCurveTo(-width*.02,-peak*.61,width*.02,-peak*.27,width*.31,3);c.lineTo(width*.61,3);c.bezierCurveTo(width*.30,-peak*.15,width*.17,-peak*.56,0,-peak);c.fill();
  c.strokeStyle='#475d4e70';c.lineWidth=.55;for(let k=0;k<3;k++){c.beginPath();c.moveTo(width*.05,-peak*(.78-k*.16));c.bezierCurveTo(width*(.03+k*.06),-peak*.40,width*(.16+k*.06),-peak*.16,width*(.25+k*.09),1);c.stroke();}
  if(height>.83){c.strokeStyle='#e7e8d5';c.lineWidth=1;c.beginPath();c.moveTo(-width*.10,-peak*.74);c.quadraticCurveTo(-width*.04,-peak*.98,0,-peak);c.lineTo(width*.08,-peak*.76);c.stroke();}
  c.restore();
 }
}
