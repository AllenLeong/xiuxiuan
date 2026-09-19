import {drawMountains} from './mountain-render.js';
import {boundaryPaths} from './map-boundaries.js';
import {drawRegions,drawPlateaus} from './region-render.js';
import {drawQiFlow} from './flow-render.js';
import {SPECIES} from './species.js';
const SPECIES_RGB=SPECIES.map(s=>s.color.match(/\w\w/g).map(v=>parseInt(v,16)));
export const LAYERS=[['natural','自然地图','#789269',0,1,'地形、温湿、岩性与植被'],['flow','灵气流向','#75d6c9',0,10,'金：地下 · 青：地表；箭头为最近一步实际转移'],['ground','地下储量','#c2a665',0,800,'灵气单位 / 格'],['air','地表灵气','#61baa8',0,150,'灵气单位 / 格'],['mineral','灵矿结合','#b4a1c8',0,400,'灵气单位 / 格'],['heat','地热','#bd7355',0,35,'背景增温 °C'],['temp','实际温度','#ca9870',-10,60,'°C'],['water','实际水分','#6fa7ba',0,1,'相对含水度'],['plants','植被','#7caa64',0,100,'草株数 / 格']];
export class MapView{
 constructor(canvas,onSelect){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.rendering=true;this.textureDirty=true;this.layer='natural';this.regionMode='significant';this.borders=false;this.selected=-1;this.onSelect=onSelect;this.zoom=1;this.ox=0;this.oy=0;this.dirty=true;this.texture=document.createElement('canvas');this.tex=this.texture.getContext('2d');this.drag=null;this.frames=[];
 new ResizeObserver(()=>this.resize()).observe(canvas);canvas.addEventListener('pointerdown',e=>{this.drag={x:e.clientX,y:e.clientY,ox:this.ox,oy:this.oy,moved:false};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.moved ||= Math.abs(dx)+Math.abs(dy)>4;if(this.drag.moved)this.autoFit=false;this.ox=this.drag.ox+dx;this.oy=this.drag.oy+dy;this.dirty=true;}const p=this.point(e);if(this.state&&p.x>=0&&p.y>=0&&p.x<this.state.size&&p.y<this.state.size)document.querySelector('#coords').textContent=`格 ${p.x}, ${p.y}`;});canvas.addEventListener('pointerup',e=>{if(this.rendering&&this.drag&&!this.drag.moved){const p=this.point(e);if(this.state&&p.x>=0&&p.y>=0&&p.x<this.state.size&&p.y<this.state.size){this.selected=p.y*this.state.size+p.x;onSelect(this.selected);}}this.drag=null;this.dirty=true;});canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();this.scale(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});const frame=t=>{this.renderFrame(t);requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 renderFrame(time){this.beforeFrame?.(time);if(this.rendering&&this.textureDirty){const start=performance.now();this.build();this.onMeasure?.('texture',performance.now()-start);}const drew=this.rendering&&this.dirty;if(drew){const start=performance.now();this.draw();this.onMeasure?.('draw',performance.now()-start);}this.onFrame?.(time,drew);this.frames.push(time);if(this.frames.length>120)this.frames.shift();}

 resize(){const r=this.canvas.getBoundingClientRect(),d=window.devicePixelRatio||1,oldW=this.width,oldH=this.height;this.width=r.width;this.height=r.height;this.canvas.width=r.width*d;this.canvas.height=r.height*d;this.ctx.setTransform(d,0,0,d,0,0);if(this.state&&(!this.fitted||this.autoFit))this.fit();else{if(oldW&&oldH){this.ox+=(r.width-oldW)/2;this.oy+=(r.height-oldH)/2;}this.dirty=true;}}
 point(e){const r=this.canvas.getBoundingClientRect();return{x:Math.floor((e.clientX-r.left-this.ox)/this.zoom),y:Math.floor((e.clientY-r.top-this.oy)/this.zoom)};}
 scale(f,x=this.width/2,y=this.height/2){this.autoFit=false;const z=Math.max(.8,Math.min(48,this.zoom*f));this.ox=x-(x-this.ox)*z/this.zoom;this.oy=y-(y-this.oy)*z/this.zoom;this.zoom=z;this.dirty=true;}
 fit(){if(!this.state)return;const rect=this.canvas.getBoundingClientRect();this.width=rect.width;this.height=rect.height;this.zoom=Math.min((this.width-170)/this.state.size,(this.height-38)/this.state.size);this.ox=145+(this.width-145-this.state.size*this.zoom)/2;this.oy=(this.height-this.state.size*this.zoom)/2;this.fitted=true;this.autoFit=true;this.dirty=true;}
 update(state){const visualChange=!this.state||this.state.map!==state.map,fresh=!this.state||this.state.seed!==state.seed||this.state.size!==state.size;this.state=state;if(fresh){this.selected=-1;this.fit();}if(visualChange)this.textureDirty=true;this.dirty=true;}
 setRendering(enabled){this.rendering=enabled;this.canvas.style.visibility=enabled?'':'hidden';if(enabled){this.textureDirty=true;this.dirty=true;}}
 setLayer(layer){this.layer=layer;this.textureDirty=true;this.dirty=true;}
 build(){if(!this.state||!this.rendering)return;this.textureDirty=false;const {size:n,map:m}=this.state;if(this.texture.width!==n*3||this.texture.height!==n*3){this.texture.width=n*3;this.texture.height=n*3;this.imageData=null;}const image=this.imageData ||= this.tex.createImageData(n*3,n*3),d=image.data,layer=LAYERS.find(l=>l[0]===this.layer);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,h=m.height[i],shade=(m.height[Math.max(0,y-1)*n+Math.max(0,x-1)]-m.height[Math.min(n-1,y+1)*n+Math.min(n-1,x+1)])*260;let r,g,b;if(this.layer==='natural'||this.layer==='flow'){if(h<.23||m.lakeDepth?.[i]>.012){const lake=m.lakeDepth?.[i]>.012;r=lake?105:111+h*60;g=lake?145:126+h*48;b=lake?138:125+h*45;}else{const moisture=m.water[i],temperature=m.temp[i],rock=m.rock[i],heat=m.heat[i];
 const grassSpecies=SPECIES[m.type[i*2]],treeSpecies=SPECIES[m.type[i*2+1]],grassCover=Math.min(1,m.mass[i*2]*(grassSpecies?.size||1)/90),treeCover=Math.min(1,m.mass[i*2+1]*(treeSpecies?.size||1)/10);
 const coverage=Math.min(.92,grassCover*.55+treeCover*.70),bare=1-coverage,exposure=Math.max(0,Math.min(1,(h-.46)*2+(1-moisture)*.35))*bare;
 // Dry sediment, wet earth, exposed bedrock, actual mineral binding, then living cover.
 r=206-moisture*62+rock*9;g=175-moisture*37-rock*13;b=112-moisture*6-rock*15;
 const blend=(rr,gg,bb,a)=>{r=r*(1-a)+rr*a;g=g*(1-a)+gg*a;b=b*(1-a)+bb*a;};
 blend(rock>.6?159:149,rock>.6?146:156,rock>.6?126:143,exposure*.7);
 blend(156,98,66,Math.min(.4,Math.max(0,heat-10)/35)*bare);
 const mineral=Math.min(.65,Math.log1p(m.mineral[i])/9)*exposure;blend(158,163,175,mineral);
 if(grassCover>0){const rgb=SPECIES_RGB[m.type[i*2]]||[120,146,96];blend(...rgb,grassCover*.55);}
 if(treeCover>0){const rgb=SPECIES_RGB[m.type[i*2+1]]||[75,102,72];blend(...rgb,treeCover*.5);}
 blend(126,151,135,Math.min(.45,Math.max(0,19-temperature)/30));blend(190,135,78,Math.min(.25,Math.max(0,temperature-30)/60)*bare);
 const cold=Math.min(.78,Math.max(0,7-temperature)/25);blend(163,175,166,cold);
 const snow=Math.min(.9,Math.max(0,1-temperature)/13)*Math.min(1,moisture*1.8);blend(229,231,215,snow);
 const relief=Math.max(-27,Math.min(24,shade*1.5));r+=relief;g+=relief;b+=relief*.85;}}else{const value=this.layer==='plants'?m.count[i*2]:m[this.layer][i],t=Math.max(0,Math.min(1,(value-layer[3])/(layer[4]-layer[3])));r=23+t*210;g=48+t*167;b=53+t*82;}
 for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){const j=((y*3+yy)*n*3+x*3+xx)*4,noise=((x*37+y*19+xx*7+yy*13)%11)-5;d[j]=r+noise;d[j+1]=g+noise;d[j+2]=b+noise;d[j+3]=255;}}
 this.tex.putImageData(image,0,0);this.dirty=true;}
 draw(){this.dirty=false;const c=this.ctx,w=this.width,h=this.height;c.clearRect(0,0,w,h);c.fillStyle=this.layer==='natural'?'#83948c':'#19231f';c.fillRect(0,0,w,h);if(!this.state)return;const {size:n,map:m}=this.state,z=this.zoom;c.save();c.translate(this.ox,this.oy);c.scale(z,z);c.imageSmoothingEnabled=true;c.drawImage(this.texture,0,0,n,n);if(this.layer==='natural'&&m.drainage){c.lineCap='round';for(let i=0;i<n*n;i++){const to=m.drainage[i];if(m.river[i]<=0||to<0||m.height[i]<.23)continue;const x=i%n,y=(i/n)|0;c.strokeStyle='#526f6680';c.lineWidth=.5+m.river[i]*1.8;c.beginPath();c.moveTo(x+.5,y+.5);c.lineTo(to%n+.5,((to/n)|0)+.5);c.stroke();c.strokeStyle='#83a39a';c.lineWidth=.22+m.river[i]*1.3;c.stroke();}}const x0=Math.max(0,Math.floor(-this.ox/z)),x1=Math.min(n,Math.ceil((w-this.ox)/z)),y0=Math.max(0,Math.floor(-this.oy/z)),y1=Math.min(n,Math.ceil((h-this.oy)/z));
 // Static paths are cached across simulation snapshots and camera motion.
 for(const edge of boundaryPaths(m,n,{contours:this.layer==='natural',borders:this.borders})){c.lineWidth=edge.width/z;c.strokeStyle=edge.color;c.stroke(edge.path);}
 if(this.layer==='natural')drawPlateaus(c,this.state,z);
 if(this.layer==='natural')for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*n+x;
 if(this.layer==='natural'&&m.count[i*2+1]>0&&(z>=5||(x*13+y*7)%9===0)){const k=i*2+1,sp=SPECIES[m.type[k]],r=Math.min(1.05,.3+Math.sqrt(m.mass[k])*.11),anc=this.state.ancients[k];c.fillStyle='#17281b50';c.beginPath();c.ellipse(x+.58,y+.66,r*.8,r*.44,0,0,Math.PI*2);c.fill();c.fillStyle=sp.spirit?'#427d79':'#586044';if(sp.name==='山松'){c.beginPath();c.moveTo(x+.5,y+.12);c.lineTo(x+.5+r,y+.8);c.lineTo(x+.5-r,y+.8);c.closePath();c.fill();}else{c.beginPath();c.arc(x+.43,y+.38,r*.72,0,Math.PI*2);c.arc(x+.65,y+.52,r*.6,0,Math.PI*2);c.arc(x+.3,y+.57,r*.6,0,Math.PI*2);c.fill();}if(z>5){c.strokeStyle='#e8e8b42a';c.lineWidth=.08;c.beginPath();c.moveTo(x+.46,y+.72);c.lineTo(x+.46,y+.4);c.stroke();}if(anc){c.strokeStyle='#875126';c.lineWidth=1/z;c.beginPath();c.arc(x+.5,y+.5,.75,0,Math.PI*2);c.stroke();}}
 if(z>12&&this.layer==='natural'&&m.count[i*2]>0){c.strokeStyle=SPECIES[m.type[i*2]].color;c.lineWidth=.045;for(let a=0;a<Math.min(6,Math.ceil(m.count[i*2]/10));a++){let gx=x+.12+(a*.19)% .8,gy=y+.72+(a%2)*.15;c.beginPath();c.moveTo(gx-.05,gy-.13);c.lineTo(gx,gy);c.lineTo(gx+.06,gy-.12);c.stroke();}}
 }
 if(this.layer==='natural'){
  drawMountains(c,m,n,{x0,x1,y0,y1,z});
  // Spiritual marks follow existing organisms and deposits; their size is a symbol, not a diffusion radius.
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=y*n+x,k=i*2+1,sp=SPECIES[m.type[k]],anc=this.state.ancients[k];
   if(m.count[k]>0&&sp?.spirit&&(anc||z>=5||(x*13+y*7)%9===0)){
    const level=m.stage?.[k]||0,r=anc?Math.max(2.4,7/z):Math.min(.9,.4+Math.sqrt(m.mass[k])*.09+level*.04);
    c.strokeStyle=anc?'#57482c':'#335955';c.lineWidth=Math.max(.10,.65/z);
    // Split trunk and layered, pale jade canopy distinguish spiritual trees from ordinary forest.
    c.beginPath();c.moveTo(x+.5,y+.9);c.bezierCurveTo(x+.2,y+.5,x+.8,y+.2,x+.5,y-r*.7);c.moveTo(x+.5,y+.6);c.lineTo(x+.5-r*.55,y+.1);c.moveTo(x+.5,y+.3);c.lineTo(x+.5+r*.65,y-.1);c.stroke();
    for(let b=0;b<3;b++){const cx=x+.5+(b-1)*r*.48,cy=y+.1-Math.abs(b-1)*r*.05-(b===1?r*.36:0);c.fillStyle=anc?'#90b8a0':'#77a899';c.beginPath();c.ellipse(cx,cy,r*.65,r*.27,0,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#d7e4bd';c.beginPath();c.ellipse(cx,cy-r*.07,r*.43,r*.08,0,Math.PI,Math.PI*2);c.stroke();c.strokeStyle=anc?'#57482c':'#335955';}
    if(anc){c.strokeStyle='#e4d59e';c.lineWidth=.75/z;c.beginPath();c.moveTo(x+.5,y-r-.3);c.lineTo(x+.5+.13,y-r-.1);c.lineTo(x+.5,y-r+.1);c.lineTo(x+.5-.13,y-r-.1);c.closePath();c.stroke();}
   }
   if(z>5&&m.count[i*2]>0&&SPECIES[m.type[i*2]]?.spirit){c.strokeStyle='#b6d5b2';c.lineWidth=Math.max(.08,.6/z);for(let b=0;b<3;b++){const px=x+.2+b*.28,py=y+.8-(b%2)*.15;c.beginPath();c.moveTo(px-.1,py-.15);c.lineTo(px,py);c.lineTo(px+.1,py-.18);c.stroke();}}

  }
  // Quiet wave strokes only on actual water cells.
  c.strokeStyle='#455e5845';c.lineWidth=Math.max(.1,.5/z);for(let y=Math.floor(y0/5)*5;y<y1;y+=5)for(let x=Math.floor(x0/7)*7;x<x1;x+=7){const i=y*n+x;if(i<0||i>=n*n||m.height[i]>.22)continue;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+.7,y-.28,x+1.5,y);c.quadraticCurveTo(x+2.2,y+.22,x+3,y-.08);c.stroke();}
 }
 if(this.layer==='natural')drawRegions(c,this.state,this.regionMode,z,this.selected);
 if(this.layer==='flow')drawQiFlow(c,this.state,{x0,x1,y0,y1,z});
 if(z>=12){c.strokeStyle='#e4e5bf20';c.lineWidth=.5/z;c.beginPath();for(let x=x0;x<=x1;x++){c.moveTo(x,y0);c.lineTo(x,y1);}for(let y=y0;y<=y1;y++){c.moveTo(x0,y);c.lineTo(x1,y);}c.stroke();}if(this.selected>=0){const x=this.selected%n,y=Math.floor(this.selected/n);c.fillStyle='#fff4b425';c.fillRect(x,y,1,1);c.strokeStyle='#fff1b8';c.lineWidth=2/z;c.strokeRect(x,y,1,1);}c.restore();
 if(this.layer==='natural'&&z<10&&this.regionMode==='off'){const placed=[];c.font='12px "Songti SC", "STSong", serif';c.textAlign='center';c.textBaseline='middle';for(const f of this.state.terrainFeatures||[]){const x=this.ox+(f.x+.5)*z,y=this.oy+(f.y+.5)*z;if(x<155||x>w-45||y<22||y>h-22||placed.some(p=>Math.abs(p.x-x)<115&&Math.abs(p.y-y)<40))continue;placed.push({x,y});c.lineWidth=3;c.strokeStyle='#e3ddc3c9';c.strokeText(f.label,x,y);c.fillStyle='#364c42';c.fillText(f.label,x,y);}}

 }
}

