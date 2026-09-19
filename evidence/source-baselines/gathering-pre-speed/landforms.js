export function landformAt(w,i){
 const n=w.size,x=i%n,y=(i/n)|0,h=w.height[i];
 if(h<.23)return h<.1?'深海':'近岸浅海';
 if(w.lakeDepth?.[i]>.012)return '内陆湖泊';
 const sample=r=>{const values=[];for(const [dx,dy]of [[-r,0],[r,0],[0,-r],[0,r],[-r,-r],[r,-r],[-r,r],[r,r]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<n&&yy>=0&&yy<n)values.push(w.height[yy*n+xx]);}return values;};
 const near=sample(Math.max(1,Math.round(n*.015))),ring=sample(Math.max(2,Math.round(n*.075)));
 const relief=Math.max(h,...near)-Math.min(h,...near),enclosed=ring.filter(v=>v>h+.065).length;
 if(w.river[i]>.25&&relief>.09)return '峡谷';
 if(h>.29&&h<.66&&ring.length>=6&&enclosed>=Math.ceil(ring.length*.7))return '盆地';
 if(h>.55&&relief<.065)return '高原';
 if(h>.72||h>.59&&relief>.13)return '山地';
 if(w.river[i]>.2)return '河谷';
 if(h<.275)return '海岸低地';
 if(relief>.06||h>.43)return '丘陵';
 return '平原';
}

// Local features may overlap the regional landform; all thresholds are grid-scale observation criteria.
export function landformDetails(w,i){
 const primary=w.lakeIsland?.[i]?'湖岛':landformAt(w,i),features=[],reasons=[],n=w.size,x=i%n,y=(i/n)|0,h=w.height[i];
 if(h<.23||w.lakeDepth?.[i]>.012)return{primary,features,reasons};
 const r=Math.max(1,Math.round(n*.015)),far=Math.max(2,Math.round(n*.05));
 const at=(dx,dy)=>{const xx=Math.max(0,Math.min(n-1,x+dx)),yy=Math.max(0,Math.min(n-1,y+dy));return w.height[yy*n+xx];};
 const card=[at(-r,0),at(r,0),at(0,-r),at(0,r)],outer=[at(-far,0),at(far,0),at(0,-far),at(0,far)],relief=Math.max(h,...card)-Math.min(h,...card),slope=relief/(2*r/n);
 const add=(label,why)=>{if(!features.includes(label)&&primary!==label){features.push(label);reasons.push(why);}};
 if(slope>8)add('悬崖','短距离高差极大，达到悬崖观测阈值');else if(slope>3)add('陡坡','短距离高差显著，坡面陡峭');
 if(Math.min(...card)>h+.008)add('洼地','局部四向地势都高于本格');
 if((Math.min(card[0],card[1])>h+.025||Math.min(card[2],card[3])>h+.025)&&Math.min(...card)<h+.01)add('山谷','横向两侧抬升，纵向保留低地通道');
 const saddle=(Math.min(outer[0],outer[1])>h+.035&&Math.max(outer[2],outer[3])<h-.025)||(Math.min(outer[2],outer[3])>h+.035&&Math.max(outer[0],outer[1])<h-.025);
 if(saddle)add(Math.max(...outer)-h>.1?'山口':'鞍部','一对方向较高、另一对方向较低，形成山脊低隘');
 if(h<.65&&Math.max(...outer)>h+.16&&relief<.11)add('山麓','紧邻更高山体，局部坡势已较缓');
 if(primary!=='高原'&&h>.34&&relief<.04&&h-Math.min(...outer)>.09)add('台地','局部顶面平缓，高于相邻低地，边缘存在落差');
 let channel=-1,channelDistance=Infinity,sea=false;
 const nr=Math.max(2,Math.round(n*.018));
 for(let dy=-nr;dy<=nr;dy++)for(let dx=-nr;dx<=nr;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=n||yy<0||yy>=n)continue;const j=yy*n+xx,dist=Math.hypot(dx,dy);if(w.height[j]<.23)sea=true;if(w.river[j]>.18&&dist<channelDistance){channel=j;channelDistance=dist;}}
 if(channel>=0){
  const ch=w.height[channel],discharge=w.catchment?.[channel]||0;
  if(relief<.06&&h>=ch-.003&&h-ch<.025&&channelDistance>0)add('河漫滩','邻近河道、地势低平且接近河道水位；首版不模拟季节洪水');
  if(sea&&h<.28&&relief<.06&&discharge>w.n*.01)add('三角洲','大汇水河道入海处的低平沉积候选区；尚未模拟泥沙演化');
  if(!sea&&h>.3&&relief<.08&&Math.max(...outer)-h>.14&&discharge>w.n*.001)add('冲积扇','有汇水通道从陡山进入缓坡，具备山前沉积条件；尚未模拟泥沙演化');
 }
 return{primary,features,reasons};
}
