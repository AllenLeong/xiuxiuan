// Environment vocabulary shared by simulation, observation and map rendering.
export const mix=(a,b,t)=>a.map((v,k)=>v*(1-t)+b[k]*t);
const bound=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const TEMPERATURE_STOPS=[[-1000,[242,248,255]],[-40,[66,125,189]],[10,[166,188,166]],[60,[212,73,45]],[1000,[29,11,19]]];
export function temperatureColor(t){for(let j=1;j<TEMPERATURE_STOPS.length;j++){const [b,bc]=TEMPERATURE_STOPS[j],[a,ac]=TEMPERATURE_STOPS[j-1];if(t<=b)return mix(ac,bc,bound((t-a)/(b-a)));}return TEMPERATURE_STOPS.at(-1)[1];}
export function temperatureBand(t){return t< -40?'极寒':t<0?'寒冷':t<18?'凉温':t<32?'温暖':t<=60?'炎热':'极热';}
export function terrainType(s,i){if(s.elevation[i]<=.205)return '海域';if(s.lake[i]>=.009)return '湖泊';const h=s.elevation[i],x=i%s.width,y=Math.floor(i/s.width);let lo=h,hi=h;for(const [dx,dy]of [[-3,0],[3,0],[0,-3],[0,3]]){const xx=bound(x+dx,0,s.width-1),yy=bound(y+dy,0,s.height-1),v=s.elevation[yy*s.width+xx];lo=Math.min(lo,v);hi=Math.max(hi,v);}const relief=hi-lo;if(relief>.20)return '峭壁';if(h>.6)return relief>.055?'高山':'高原';if(h>.43)return relief>.055?'山地':'台地';if(s.river[i]>2)return '河谷';if(h>.34)return '丘陵';return '平原';}
export const SURFACES={海域:[52,94,110],湖泊:[83,145,157],熔岩地:[62,37,44],火山荒地:[93,74,92],冰盖:[223,235,238],雪原:[206,220,218],冻原:[149,169,168],沙漠:[209,175,114],旱原:[184,161,105],湿地:[109,149,128],草甸:[153,174,113],岩地:[148,142,120],林地:[88,126,86]};
export function surfaceType(s,i){if(s.elevation[i]<=.205)return '海域';if(s.lake[i]>=.009)return '湖泊';if(s.temp[i]>200)return '熔岩地';if(s.heat[i]>12&&s.water[i]<.55)return '火山荒地';if(s.temp[i]< -40)return '冰盖';if(s.snow[i]>.22)return '雪原';if(s.temp[i]<0)return '冻原';if(s.rain[i]<.15&&s.water[i]<.3)return '沙漠';if(s.water[i]>.77)return '湿地';if(s.mass[i*2+1]>.8)return '林地';if(s.elevation[i]>.48)return '岩地';if(s.water[i]<.32)return '旱原';return '草甸';}
export function precipitation(w,i){const cold=bound((3-w.temp[i])/12);w.snow[i]=w.rain[i]*cold;w.rainfall[i]=w.rain[i]*(1-cold);}
