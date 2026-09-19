import {temperatureColor,mix,terrainType,surfaceType,SURFACES} from './ecology.js';
import {identifyRegions,DIMENSIONS} from './regions.js';
import {vegetationMark,surfaceMark} from './assets.js';
import {PLANTS,clamp,hash} from './model.js';
const $=id=>document.getElementById(id),worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'}),canvas=$('map'),ctx=canvas.getContext('2d'),texture=document.createElement('canvas'),tc=texture.getContext('2d');
let state,baseline,layer='natural',running=false,z=1,ox=0,oy=0,selected=-1,dirty=true,peaks=[],contours=[],drag=null,cameraFitted=true;
const legends={rain:'降雨量：沙色 → 深蓝 · 年平均相对量 0—1',snow:'降雪量：灰蓝 → 白 · 年平均相对量 0—1',natural:'地表：雪冰 / 沙漠 / 草甸 / 林地 / 火山 · 由环境与植被决定',air:'地表游离气：淡 → 深 0 / 1 / 4 / 12 / 35 / 100（固定尺度）',plant:'植物内部积累：淡 → 深 0 / 10 / 100 / 1000（固定尺度）',source:'地质供给：暗 → 亮 0 / 0.05 / 0.2 / 0.6 单位 / 年',temperature:'界温：−1000 白 → −40 蓝 → 60 红 → 1000 黑 · 极端区稀少',plates:'7 个地质板块 · 箭头为相对运动 · 不是州界',mantle:'地幔热背景与水平分流代理 · 不是完整流体模拟',geology:'山体抬升 / 裂谷 / 地热 · 基于板块相对运动',retention:'绿色表示本地留存能力 · 紫色表示灵植吸引'};
let regionDimension='none',regionCache=null,regionState=null;
const mountainAtlas=new Image();mountainAtlas.onload=()=>dirty=true;mountainAtlas.src='./assets/mountain-atlas.png';
const portraitAtlas=new Image();portraitAtlas.onload=()=>dirty=true;portraitAtlas.src='./assets/vegetation-atlas.png';
function currentRegions(s){if(regionState!==s){regionCache=identifyRegions(s);regionState=s;}return regionCache;}

function build(){if(!state)return;const s=$('baseline').checked&&baseline?baseline:state,w=s.width,h=s.height;texture.width=w;texture.height=h;const im=tc.createImageData(w,h);
 for(let i=0;i<w*h;i++){
  const e=s.elevation[i],sea=e<=.205,lake=s.lake[i]>=.009;let rgb;
  if(layer==='plates'){rgb=[[169,189,207],[194,163,105],[172,183,124],[102,149,113],[142,111,134],[129,175,174],[71,117,130]][s.plate[i]];}
  else if(layer==='mantle'){rgb=mix([51,84,88],[230,146,81],clamp(s.mantle[i]/1.5));}
  else if(layer==='air'){rgb=mix([191,199,170],[27,95,91],clamp(Math.log1p(s.air[i])/Math.log(101)));}
  else if(layer==='plant'){rgb=mix([183,193,158],[66,58,107],clamp(Math.log1p(s.qi[i*2]+s.qi[i*2+1])/Math.log(1001)));}
  else if(layer==='source'){rgb=mix([83,103,90],[242,185,88],clamp(s.source[i]/.6));}
  else if(layer==='temperature'){rgb=temperatureColor(s.temp[i]);}
  else if(layer==='rain'){rgb=mix([199,171,121],[44,114,136],s.rainfall[i]);}
  else if(layer==='snow'){rgb=mix([106,131,139],[239,247,252],s.snow[i]);}
  else if(layer==='geology'){rgb=mix([170,172,137],[75,103,91],clamp((e-.25)*2));rgb=mix(rgb,[180,82,51],clamp(s.heat[i]/22)*.7);}
  else if(layer==='retention'){rgb=mix([187,187,148],[59,109,70],s.retention[i]);rgb=mix(rgb,[145,94,165],clamp(s.attract[i]/1.5));}
  else{
   rgb=SURFACES[surfaceType(s,i)];
   const grass=PLANTS[s.type[i*2]],tree=PLANTS[s.type[i*2+1]],toRGB=c=>[1,3,5].map(k=>parseInt(c.slice(k,k+2),16));
   if(grass)rgb=mix(rgb,toRGB(grass.color),clamp(s.mass[i*2]/5)*.4);
   if(tree)rgb=mix(rgb,toRGB(tree.color),clamp(s.mass[i*2+1]/2)*.62);
   const j=i%w<w-1?i+1:i,k=i>=w?i-w:i;const shade=clamp((s.elevation[k]-s.elevation[j])*-3,-.2,.2);rgb=rgb.map(v=>v*(1+shade)+(hash(i,0,17)-.5)*7);
  }
  if((sea||lake)&&!['temperature','rain','snow'].includes(layer)){const water=sea?mix([51,94,108],[91,138,143],clamp(e/.205)):mix([92,153,153],[127,178,172],clamp(s.lake[i]*3));rgb=layer==='plates'||layer==='mantle'?mix(rgb,water,.2):water;}
  const p=i*4;im.data[p]=rgb[0];im.data[p+1]=rgb[1];im.data[p+2]=rgb[2];im.data[p+3]=255;
 }
 tc.putImageData(im,0,0);dirty=true;$('legend').textContent=($('baseline').checked?'起点对照 · ':'')+(regionDimension==='none'?legends[layer]:DIMENSIONS[regionDimension]+' · '+currentRegions(s)[regionDimension].regions.length+' 片 · 色块为实际范围，点击查看边界');
}
function staticShapes(){peaks=[];contours=[];const s=state,w=s.width,h=s.height;
 for(let y=0;y<h;y+=7)for(let x=0;x<w;x+=7){let best=-1,e=.49;for(let yy=y;yy<Math.min(h,y+7);yy++)for(let xx=x;xx<Math.min(w,x+7);xx++){const i=yy*w+xx;if(s.elevation[i]>e&&s.lake[i]<.009){e=s.elevation[i];best=i;}}if(best<0)continue;const bx=best%w,by=Math.floor(best/w),r=4,lo=Math.min(...[[-r,0],[r,0],[0,-r],[0,r]].map(([a,b])=>s.elevation[clamp(by+b,0,h-1)*w+clamp(bx+a,0,w-1)]));if(e-lo<.025)continue;peaks.push({i:best,relief:e-lo,kind:terrainType(s,best),x:bx+.5,y:by+.5,w:1.5+(e-.4)*4.5,h:2.1+(e-.4)*8.5,e});}
 for(let y=8;y<h;y+=15)for(let x=8;x<w;x+=15){const i=y*w+x,kind=terrainType(s,i);if(kind==='高原'||kind==='台地')peaks.push({i,relief:0,kind,x:x+.5,y:y+.5,w:2.7,h:2.5,e:s.elevation[i]});}
 for(const level of [.32,.42,.52,.62,.72,.82])for(let y=0;y<h-2;y+=2)for(let x=0;x<w-2;x+=2){const points=[[x,y],[x+2,y],[x+2,y+2],[x,y+2]],v=points.map(([a,b])=>s.elevation[b*w+a]),hits=[];for(let k=0;k<4;k++){const j=(k+1)%4;if((v[k]>=level)===(v[j]>=level))continue;const t=(level-v[k])/(v[j]-v[k]);hits.push([points[k][0]+(points[j][0]-points[k][0])*t,points[k][1]+(points[j][1]-points[k][1])*t]);}if(hits.length===2)contours.push(hits);}
}
function fit(){if(!state)return;cameraFitted=true;const r=canvas.getBoundingClientRect();z=Math.min((r.width-170)/state.width,(r.height-26)/state.height);ox=150+(r.width-150-state.width*z)/2;oy=(r.height-state.height*z)/2;dirty=true;}
function render(){requestAnimationFrame(render);if(!dirty||!state)return;dirty=false;const r=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);ctx.save();ctx.translate(ox,oy);ctx.scale(z,z);ctx.imageSmoothingEnabled=layer==='natural'&&z<4;ctx.drawImage(texture,0,0);ctx.imageSmoothingEnabled=false;
 const s=$('baseline').checked&&baseline?baseline:state,w=s.width,h=s.height;
 if(['natural','geology'].includes(layer)){ctx.strokeStyle='#324a3930';ctx.lineWidth=.45/z;ctx.beginPath();for(const [a,b]of contours){ctx.moveTo(...a);ctx.lineTo(...b);}ctx.stroke();}
 if(['natural','geology','temperature','air','plant'].includes(layer)){
  // Catchment determines river hierarchy; a trunk is visibly wider than tributaries.
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const [lo,hi,size,color]of [[1,2.5,.20,'#86b9bba0'],[2.5,4.5,.8,'#639faabf'],[4.5,Infinity,1.9,'#437f91']]){
   ctx.strokeStyle=color;ctx.lineWidth=size;ctx.beginPath();
   for(let i=0;i<w*h;i++)if(s.river[i]>lo&&s.river[i]<=hi&&s.elevation[i]>.205&&s.lake[i]<.009){const x=i%w,y=Math.floor(i/w),j=s.down[i];if(j<0)continue;ctx.moveTo(x+.5,y+.5);ctx.lineTo(j%w+.5,Math.floor(j/w)+.5);}ctx.stroke();
  }
 }
 if(layer==='natural'||layer==='geology'){
  for(const p of peaks){if(ox+(p.x+p.w)*z<0||ox+(p.x-p.w)*z>r.width||oy+(p.y+2)*z<0||oy+(p.y-p.h)*z>r.height)continue;const{x,y,w:a,h:b}=p;
   if(layer==='natural'&&mountainAtlas.complete&&mountainAtlas.naturalWidth){
    const art=p.kind==='高原'||p.kind==='台地'?7:s.temp[p.i]<0?2:s.heat[p.i]>12?4:p.kind==='峭壁'?5:p.e<.55?3:p.relief>.18&&s.compression[p.i]<.2?0:p.e>.65?6:1;
    const sw=mountainAtlas.naturalWidth/4,sh=mountainAtlas.naturalHeight/2;ctx.imageSmoothingEnabled=true;ctx.drawImage(mountainAtlas,art%4*sw,Math.floor(art/4)*sh,sw,sh,x-a,y-b*1.3,a*2,b*1.5);ctx.imageSmoothingEnabled=false;continue;
   }ctx.save();ctx.translate(x,y);const g=ctx.createLinearGradient(0,-b,0,2);g.addColorStop(0,p.e>.65?'#d3dccc':'#bac7ab');g.addColorStop(.7,'#708977c0');g.addColorStop(1,'#70897700');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-a*.7,2);ctx.bezierCurveTo(-a*.5,-b*.18,-a*.2,-b*.7,0,-b);ctx.bezierCurveTo(a*.17,-b*.62,a*.18,-b*.30,a*.36,-b*.43);ctx.bezierCurveTo(a*.47,-b*.45,a*.52,-b*.1,a*.74,2);ctx.closePath();ctx.fill();ctx.strokeStyle='#3c584bb0';ctx.lineWidth=.35;ctx.stroke();ctx.beginPath();ctx.moveTo(0,-b);ctx.quadraticCurveTo(-a*.05,-b*.38,a*.32,1);ctx.stroke();ctx.strokeStyle='#30483c70';ctx.lineWidth=.20;ctx.beginPath();ctx.moveTo(-a*.40,-b*.20);ctx.lineTo(-a*.18,-b*.55);ctx.lineTo(-a*.08,-b*.27);ctx.moveTo(a*.20,-b*.23);ctx.lineTo(a*.32,-b*.38);ctx.lineTo(a*.49,0);ctx.stroke();ctx.restore();}
 }
 if(layer==='plant'||(layer==='natural'&&!portraitAtlas.complete))for(let y=1;y<h;y+=2)for(let x=1;x<w;x+=2){const i=y*w+x,k=i*2+1,p=PLANTS[s.type[k]];if(!p||s.elevation[i]<=.205||s.lake[i]>=.009||s.mass[k]<.35||hash(i,77,17)>clamp(s.mass[k]/2)*.8)continue;vegetationMark(ctx,x+(hash(i,2,17)-.5),y,p,s.mass[k],s.stage[k]);}
 if(layer==='natural'&&portraitAtlas.complete&&portraitAtlas.naturalWidth){
  ctx.imageSmoothingEnabled=true;const sw=portraitAtlas.naturalWidth/4,sh=portraitAtlas.naturalHeight/2;
  for(let y=3;y<h;y+=5)for(let x=3;x<w;x+=5){const i=y*w+x,k=i*2+1,p=PLANTS[s.type[k]];if(!p||s.mass[k]<.55||s.elevation[i]<=.205||s.lake[i]>=.009||hash(i,81,23)>.68)continue;
   const a=2.1+Math.min(1.1,s.mass[k]*.45),b=a*sh/sw,dx=(hash(i,83,23)-.5)*4,dy=(hash(i,85,23)-.5)*4;ctx.drawImage(portraitAtlas,p.sprite%4*sw,Math.floor(p.sprite/4)*sh,sw,sh,x+dx-a/2,y+dy-b,a,b);
  }ctx.imageSmoothingEnabled=false;
 }
 if(layer==='natural')for(let y=4;y<h;y+=9)for(let x=4;x<w;x+=9){const i=y*w+x;const t=terrainType(s,i)==='峭壁'?'峭壁':surfaceType(s,i);surfaceMark(ctx,x,y,t);}
 if(regionDimension!=='none'){
  const data=currentRegions(s)[regionDimension],picked=selected>=0?data.ids[selected]:-1;
  for(const region of data.regions){const hue=Array.from(region.label).reduce((n,c)=>(n*31+c.charCodeAt(0))%360,23);ctx.fillStyle=`hsla(${hue},48%,58%,${picked===region.id?.43:.22})`;for(const i of region.cells)ctx.fillRect(i%w,Math.floor(i/w),1,1);
   if(picked===region.id){ctx.strokeStyle=picked===region.id?'#fff7d4':`hsla(${hue},50%,25%,.75)`;ctx.lineWidth=(picked===region.id?1.5:.7)/z;ctx.beginPath();for(const [a,b,c,d]of region.edges){ctx.moveTo(a,b);ctx.lineTo(c,d);}ctx.stroke();}
  }
 }

 if(layer==='plates'||layer==='mantle'){for(let i=0;i<s.plates.length;i++){const p=s.plates[i],x=p.x*w,y=p.y*h;ctx.fillStyle='#1c3439';ctx.font=`${11/z}px sans-serif`;if(layer==='plates')ctx.fillText('板块 '+(i+1),x-12/z,y);arrow(x,y,p.vx*15,p.vy*15,'#183f48',1/z);}if(layer==='mantle')for(let y=12;y<h;y+=24)for(let x=12;x<w;x+=24){const i=y*w+x;arrow(x,y,s.mantleX[i]*10,s.mantleY[i]*10,'#624030a0',.7/z);}}
 if($('routes').checked){ctx.strokeStyle='#e6d6a9aa';ctx.lineWidth=1.3/z;for(const route of s.routes){ctx.beginPath();route.forEach((i,k)=>{const x=i%w+.5,y=Math.floor(i/w)+.5;k?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}ctx.fillStyle='#e4af6b';for(let i=0;i<w*h;i++)if(s.pass[i])ctx.fillRect(i%w-.3,Math.floor(i/w)-.3,1.6,1.6);}
 if($('directions').checked){const step=Math.max(3,Math.ceil(16/z));for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){let vx=0,vy=0,net=0,count=0;for(let yy=y;yy<Math.min(h,y+step);yy++)for(let xx=x;xx<Math.min(w,x+step);xx++){const i=yy*w+xx;vx+=s.flowX[i];vy+=s.flowY[i];net+=s.outflow[i]-s.inflow[i];count++;}vx/=count;vy/=count;const magnitude=Math.hypot(vx,vy);if(magnitude<.0003)continue;const len=Math.min(step*.8,step*.25+magnitude*step*12),alpha=.25+clamp(Math.log1p(magnitude*80)/3)*.7;arrow(x+step/2,y+step/2,vx/magnitude*len,vy/magnitude*len,`rgba(18,49,47,${alpha})`,(.7+clamp(magnitude*6))/z);}}
 if($('grid').checked&&z>=5){ctx.strokeStyle='#1c40332c';ctx.lineWidth=.45/z;ctx.beginPath();for(let x=Math.max(0,Math.floor(-ox/z));x<Math.min(w,(r.width-ox)/z);x++){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=Math.max(0,Math.floor(-oy/z));y<Math.min(h,(r.height-oy)/z);y++){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();}
 if(selected>=0){ctx.strokeStyle='#f5edcc';ctx.lineWidth=1.5/z;ctx.strokeRect(selected%w,Math.floor(selected/w),1,1);ctx.beginPath();ctx.arc(selected%w+.5,Math.floor(selected/w)+.5,4/z,0,Math.PI*2);ctx.stroke();}ctx.restore();
}
function arrow(x,y,dx,dy,color,width){const length=Math.hypot(dx,dy);if(length<.01)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx,y+dy);const a=Math.atan2(dy,dx),head=Math.min(length*.3,2.4);ctx.moveTo(x+dx-head*Math.cos(a-.6),y+dy-head*Math.sin(a-.6));ctx.lineTo(x+dx,y+dy);ctx.lineTo(x+dx-head*Math.cos(a+.6),y+dy-head*Math.sin(a+.6));ctx.stroke();}
const number=v=>Math.abs(v)<.01?v.toExponential(1):v.toLocaleString('zh-CN',{maximumFractionDigits:2});
const row=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`;
function details(){if(selected<0||!state)return;const s=$('baseline').checked&&baseline?baseline:state,i=selected,e=s.elevation[i],terrain=terrainType(s,i)+' / '+surfaceType(s,i);let html=`<h3>${terrain} · ${i%s.width}, ${Math.floor(i/s.width)}</h3><p>板块 ${s.plate[i]+1} · ${number(s.temp[i])}° 界温 · 水分 ${number(s.water[i])}<br>山体阻挡 ${number(s.mountainBarrier[i]*100)}%（强度）<br>留存 ${number(s.retention[i]*100)}% · 吸引 ${number(s.attract[i])}</p>`;
 if(regionDimension!=='none'){const data=currentRegions(s)[regionDimension],r=data.regions[data.ids[i]];html+='<h3>'+DIMENSIONS[regionDimension]+'</h3>'+(r?'<p>'+r.label+'<br>'+r.area+' 格 · 平均界温 '+number(r.temp)+'°<br>平均地表气 '+number(r.air)+' · 平均植内积累 '+number(r.plant)+'</p>':'<p>此处尚未形成连续成规模片区</p>');}
 const surface=surfaceType(s,i),landform=terrainType(s,i),art=surface==='熔岩地'||surface==='火山荒地'?0:surface==='冰盖'||surface==='雪原'?6:landform==='峭壁'?5:landform==='高山'||landform==='山地'?4:surface==='林地'?1:surface==='沙漠'||surface==='旱原'?3:surface==='湿地'||landform==='河谷'||surface==='湖泊'?7:2;
 if(surface!=='海域')html+=`<details><summary>地貌图鉴 · ${surface}</summary><div class="terrain-portrait" style="background-position:${art%4/3*100}% ${art<4?0:100}%" title="${surface} · ${landform} 地貌示意"></div><small>地貌示意 · 依据此格实际类型</small></details>`;
 html+='<h3>存量 · 当前在哪里</h3>';
 for(const [a,v]of [['地表游离',s.air[i]],['地下',s.ground[i]],['植物',s.qi[i*2]+s.qi[i*2+1]],['岩土',s.soil[i]],['遗骸',s.detritus[i]]])html+=row(a,number(v));
 html+='<h3>最近一年 · 增量与流量</h3>';for(const [a,v]of [['地质供给能力 / 年',s.source[i]],['实际加工进入地下',s.geology[i]],['灵植加工进入体内',s.processing[i]],['进入地表（出露 / 回流 / 释放）',s.increment[i]],['邻格流入',s.inflow[i]],['邻格流出',s.outflow[i]],['山脉阻挡留在源格',s.blocked[i]],['净流失（流出 − 流入）',s.outflow[i]-s.inflow[i]],['植物吸收地表',s.uptake[i]],['植物直接取用地下',s.root[i]],['岩土结合',s.binding[i]],['宇宙逸散',s.escape[i]],['地表净变化',s.change[i]]])html+=row(a,number(v));
 html+=row('降雨 / 降雪',number(s.rainfall[i])+' / '+number(s.snow[i]));

 html+='<h3>植被</h3>';for(let l=1;l>=0;l--){const k=i*2+l,t=s.type[k];html+=row(l?'树层':'草层',t<0?'无':PLANTS[t].name);if(t>=0&&l)html+=`<div class="species-portrait" style="background-position:${(PLANTS[t].sprite%4)/3*100}% ${PLANTS[t].sprite<4?0:100}%" title="${PLANTS[t].name} 图鉴"></div>`;if(t>=0)html+=`<p>生物量 ${number(s.mass[k])} · 灵气阶段 ${s.stage[k]}<br>内部积累 ${number(s.qi[k])} · 承载 ${number(s.mass[k]*PLANTS[t].capacity*2**s.stage[k])}</p>`;}
 $('cell').innerHTML=html;$('detail').hidden=false;document.querySelectorAll('[data-edit]').forEach(b=>b.disabled=running||$('baseline').checked||e<=.205||s.lake[i]>=.009);
}
function history(){const s=state,rows=s.history,a=rows[0],b=rows.at(-1);$('comparison').textContent=`第 ${a.year} 年 → ${b.year} 年（历史自动分层留样）`;$('metrics').innerHTML=`<div><span>地表游离量</span>${number(a.air)} → ${number(b.air)}</div><div><span>植物积累</span>${number(a.plant)} → ${number(b.plant)}</div><div><span>林地格数 / 灵树格数</span>${b.forest.toLocaleString()} / ${b.spirit.toLocaleString()}</div><div><span>累计外部输入 / 宇宙逸散</span>${number(s.ledger.input)} / ${number(s.ledger.escaped)}</div>`;
 const c=$('chart'),r=c.getBoundingClientRect(),d=devicePixelRatio||1;c.width=r.width*d;c.height=r.height*d;const g=c.getContext('2d');g.scale(d,d);const max=Math.max(1,...rows.map(v=>Math.max(v.air,v.plant))),last=Math.max(1,b.year);g.strokeStyle='#9aa88b30';g.beginPath();g.moveTo(0,r.height-16);g.lineTo(r.width,r.height-16);g.stroke();for(const [key,color]of [['air','#90c8b8'],['plant','#cbb5e1']]){g.strokeStyle=color;g.lineWidth=1.5;g.beginPath();rows.forEach((v,i)=>{const x=v.year/last*r.width,y=(r.height-30)*(1-v[key]/max)+3;i?g.lineTo(x,y):g.moveTo(x,y);});g.stroke();}g.font='10px sans-serif';g.fillStyle='#90c8b8';g.fillText('地表',4,r.height-2);g.fillStyle='#cbb5e1';g.fillText('植物 · 同一数量尺度',42,r.height-2);}
worker.onmessage=({data:d})=>{if(d.kind==='error'){$('loading').hidden=true;$('status').textContent='错误：'+d.message;return;}regionState=null;const fresh=!state||state.seed!==d.state.seed||state.width!==d.state.width||d.state.year===0&&state.year>0;state=d.state;running=d.running;$('loading').hidden=true;$('play').textContent=running?'暂停':'运行';$('year').textContent=`第 ${state.year} 年`;$('status').textContent=`${running?'推演至 '+d.target+' 年 · '+((state.year-d.startYear)/(d.target-d.startYear)*100).toFixed(1)+'%'+(d.eta!==null?' · 预计剩余 '+Math.ceil(d.eta/60)+' 分钟':' · 估算中'):'暂停'} · ${state.width} × ${state.height} · 7 板块`;$('balance').textContent=`守恒误差 ${state.ledger.error.toExponential(2)}`;document.querySelectorAll('[data-years],#step,#generate,#seed,#width').forEach(b=>b.disabled=running);$('play').disabled=false;$('sample').disabled=false;if(fresh){baseline=state;$('baseline').checked=false;selected=-1;$('detail').hidden=true;staticShapes();fit();}build();details();history();};
function generate(){state=null;baseline=null;$('loading').hidden=false;document.querySelectorAll('[data-years],#step,#play,#sample').forEach(b=>b.disabled=true);worker.postMessage({kind:'generate',options:{seed:$('seed').value,width:Number($('width').value)}});}
$('regions').onchange=()=>{regionDimension=$('regions').value;$('region-icon').src='./assets/'+(['temperature','forest','terrain','qi'].includes(regionDimension)?regionDimension:'terrain')+'.svg';build();details();};$('generate').onclick=generate;$('play').onclick=()=>worker.postMessage(running?{kind:'pause'}:{kind:'advance',years:10000});$('step').onclick=()=>worker.postMessage({kind:'advance',years:1});document.querySelectorAll('[data-years]').forEach(b=>b.onclick=()=>worker.postMessage({kind:'advance',years:Number(b.dataset.years)}));document.querySelectorAll('[data-layer]').forEach(b=>b.onclick=()=>{layer=b.dataset.layer;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('active',x===b));build();});document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>worker.postMessage({kind:'edit',i:selected,edit:b.dataset.edit}));for(const id of ['directions','routes','grid'])$(id).onchange=()=>dirty=true;$('baseline').onchange=()=>{build();details();};$('sample').onclick=()=>{if(!state)return;cameraFitted=false;let best=-1,score=0;for(let i=0;i<state.width*state.height;i++){const k=i*2+1;if(state.type[k]===6&&state.mass[k]>score){best=i;score=state.mass[k];}}if(best<0)return;selected=best;const r=canvas.getBoundingClientRect();z=8;ox=r.width*.48-(best%state.width+.5)*z;oy=r.height*.5-(Math.floor(best/state.width)+.5)*z;details();dirty=true;};$('fit').onclick=fit;$('close').onclick=()=>{$('detail').hidden=true;selected=-1;dirty=true;};
canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,ox,oy,moved:false};};canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved){cameraFitted=false;ox=drag.ox+dx;oy=drag.oy+dy;dirty=true;}};canvas.onpointerup=e=>{if(drag&&!drag.moved&&state){const r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left-ox)/z),y=Math.floor((e.clientY-r.top-oy)/z);if(x>=0&&y>=0&&x<state.width&&y<state.height){selected=y*state.width+x;details();dirty=true;}}drag=null;};canvas.onwheel=e=>{e.preventDefault();cameraFitted=false;const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,nz=clamp(z*Math.exp(-e.deltaY*.0015),.3,45);ox=x-(x-ox)*nz/z;oy=y-(y-oy)*nz/z;z=nz;dirty=true;};window.addEventListener('resize',()=>{dirty=true;if(state){if(cameraFitted)fit();history();}});
$('export').onclick=()=>{if(!state)return;const data={seed:state.seed,width:state.width,height:state.height,year:state.year,ledger:state.ledger,history:state.history,events:state.events,selected:selected<0?null:{i:selected,air:state.air[selected],plant:state.qi[selected*2]+state.qi[selected*2+1]}};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`横陆-${state.year}年-观测.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
generate();render();
