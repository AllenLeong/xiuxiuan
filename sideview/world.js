import {SCENE_CAVES,ORIGIN,pathY,LEDGES,WALKABLE,sceneGround,sceneX} from './mountain-scene.js';
import {mountainZone,routeHeight} from './mountain.js';
export const TILE=24, CHUNK=32, WIDTH=160000, TOP=-9000, BOTTOM=5600;
export const hash=(x,y=0)=>{let a=Math.imul(x+83171,374761393)^Math.imul(y+1877,668265263);a=Math.imul(a^(a>>>13),1274126177);return((a^(a>>>16))>>>0)/4294967295;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// This is the low road, not the mountain skyline. A traveller enters wooded
// foothills and goes around the peaks in depth; upper mountains are separate
// traversable terraces, stairs and bridges layered above this route.
const anchors=[[0,520],[7000,430],[17000,360],[25500,500],[28500,470],
 [34000,390],[39500,450],[43500,500],[50000,720],[52000,980],[55000,500],
 [65000,300],[73500,360],[83500,260],[94000,470],[97000,430],
 [103000,360],[112500,430],[120000,350],[126000,420],[133000,410],
 [141000,520],[150000,340],[WIDTH,520]];
export function surface(x){x=clamp(x,0,WIDTH);let k=1;while(anchors[k][0]<x)k++;const [a,ay]=anchors[k-1],[b,by]=anchors[k],t=(x-a)/(b-a),blend=t*t*(3-2*t);return ay+(by-ay)*blend+Math.sin(x*.0009)*26+Math.sin(x*.0031)*9;}
export const LOCATIONS=[
 {id:'village',name:'河畔村',x:2200,kind:'village',desc:'农田与驿亭 · 旅程起点'},
 {id:'city',name:'临河城',x:14000,kind:'city',desc:'西市、酒楼、城主府与东门'},
 {id:'small-path',name:'松岭林径',x:30500,kind:'path',desc:'低境界从林间绕过山峰'},
 {id:'small',name:'松崖门',x:34500,y:-1510,kind:'sect',desc:'林径绕峰而行，石阶可登门'},
 {id:'mine',name:'旧矿井',x:40900,kind:'mine',desc:'竖井通向矿层与地下遗迹'},
 {id:'river',name:'大河渡口',x:52000,kind:'river',desc:'桥梁跨河，水下另有通路'},
 {id:'forest',name:'苍翠林海',x:71500,kind:'forest',desc:'灵植与商路穿过的山林'},
 {id:'great-path',name:'玄岳林径',x:108000,kind:'path',desc:'山麓道路延伸在诸峰之下'},
 {id:'gate',name:'玄岳仙门 · 山门',x:101000,y:-900,kind:'sect',desc:'山麓林径、石阶和御器路线在此分开'},
 {id:'summit',name:'玄岳仙门 · 主峰',x:116000,y:-5310,kind:'summit',desc:'主峰直入云层，楼台沿崖分层'},
 {id:'sky',name:'云上孤屿',x:119200,y:-7050,kind:'sky',desc:'高空区域 · 可御剑抵达'},
 {id:'ruin',name:'地下旧殿',x:43700,y:1530,kind:'ruin',desc:'矿道深处的旧殿，空间不会因势力灭亡而消失'},
 {id:'deep',name:'地脉深处',x:45100,y:2880,kind:'deep',desc:'更深的地下层，向下探索仍有空间'}
];
export const MODES={walk:{name:'炼气 · 步行',speed:150,jump:365,fly:0,stamina:100},glide:{name:'筑基 · 御器',speed:240,jump:410,fly:260,stamina:120},sword:{name:'金丹 · 御剑',speed:410,jump:430,fly:490,stamina:180}};
export const PLATFORMS=[
 // 临河城：街市、城楼、内城三层，竖向交通是真实碰撞路线。
 {x1:11600,x2:15400,y:120,depth:48,kind:'city'},{x1:13000,x2:16000,y:-180,depth:48,kind:'city'},
 {x1:14400,x2:16550,y:-480,depth:48,kind:'city'},
 // 松崖门：凡人驿道从山腹穿过，宗门沿山崖向上展开。
 {x1:32500,x2:35900,y:-520,depth:42,kind:'sect'},{x1:33700,x2:36800,y:-980,depth:42,kind:'sect'},
 {x1:33100,x2:35600,y:-1510,depth:52,kind:'sect'},
 // 玄岳仙门：多层地基，每层都可行走并承载山林与建筑。
 {x1:99600,x2:103600,y:-900,depth:48,kind:'sect'},{x1:102800,x2:108700,y:-1900,depth:48,kind:'sect'},
 {x1:106800,x2:112500,y:-3000,depth:48,kind:'sect'},{x1:110800,x2:117800,y:-4080,depth:48,kind:'sect'},
 {x1:113900,x2:119100,y:-5310,depth:56,kind:'sect'},{x1:118100,x2:123700,y:-3820,depth:48,kind:'sect'},
 {x1:122000,x2:128000,y:-2420,depth:48,kind:'sect'}
];
// Each upper foundation is a complete walkable stratum. Hills and mountains sit
// on that foundation instead of replacing it. Their slopes are shallow enough
// to traverse with the ordinary step solver.
export const MOUNDS=[
 {cx:15150,r:850,h:180,base:-480,kind:'hill'},{cx:13650,r:700,h:130,base:-180,kind:'hill'},
 {cx:35500,r:900,h:330,base:-520,kind:'mountain'},{cx:36500,r:850,h:280,base:-980,kind:'mountain'},{cx:33400,r:620,h:240,base:-1510,kind:'mountain'},
 {cx:102700,r:900,h:470,base:-900,kind:'mountain'},{cx:108000,r:1050,h:560,base:-1900,kind:'mountain'},
 {cx:111700,r:1050,h:620,base:-3000,kind:'mountain'},{cx:116900,r:1200,h:760,base:-4080,kind:'mountain'},
 {cx:118200,r:850,h:520,base:-5310,kind:'mountain'},{cx:122600,r:900,h:520,base:-3820,kind:'mountain'},
 {cx:126700,r:820,h:430,base:-2420,kind:'mountain'}
];
export const RAMPS=[
 {x1:96500,y1:surface(96500),x2:100200,y2:-900},{x1:102200,y1:-900,x2:105200,y2:-1900},
 {x1:106400,y1:-1900,x2:109300,y2:-3000},{x1:110100,y1:-3000,x2:113000,y2:-4080},
 {x1:113200,y1:-4080,x2:115300,y2:-5310},{x1:123400,y1:-3820,x2:126600,y2:-2420},
 {x1:127000,y1:-2420,x2:132500,y2:surface(132500)},
 {x1:30000,y1:surface(30000),x2:32800,y2:-520},{x1:33200,y1:-520,x2:34100,y2:-980},{x1:34300,y1:-980,x2:35000,y2:-1510}
];
export function upperSurface(x,base){let top=base;for(const m of MOUNDS){if(m.base!==base)continue;const d=Math.abs(x-m.cx);if(d>=m.r)continue;const u=d/m.r;top=Math.min(top,base-m.h*(1-u*u));}return top;}
// The mountain is a continuous world-space mass. Routes are exposed paths on
// its front / back slopes, so this backing geometry is not a solid collision wall.
export function mountainSurface(x){
 let top=surface(x);
 for(const p of PLATFORMS){
  const shoulder=p.kind==='city'?650:1500;
  if(x<p.x1-shoulder||x>p.x2+shoulder)continue;
  const edge=Math.max(0,p.x1-x,x-p.x2),u=Math.min(1,edge/shoulder),fade=u*u*(3-2*u);
  const ridge=p.kind==='sect'?160+Math.pow(Math.sin((x-p.x1)*.0016),2)*360+Math.pow(Math.sin(x*.0031),4)*170:90;
  const crest=upperSurface(Math.max(p.x1,Math.min(p.x2,x)),p.y)-ridge;
  top=Math.min(top,crest+(surface(x)-crest)*fade);
 }
 for(const r of RAMPS){if(x<r.x1||x>r.x2)continue;top=Math.min(top,r.y1+(r.y2-r.y1)*(x-r.x1)/(r.x2-r.x1)-70);}
 return top;
}
export const CAVE_ENTRANCES=[
 {id:'pine-cave',name:'松崖石窟',x:35500,y:upperSurface(35500,-520),layer:'山门层'},
 ...SCENE_CAVES
];
export const LADDERS=[
 {x:13200,top:120,bottom:surface(13200)},{x:14500,top:-180,bottom:120},{x:15500,top:-480,bottom:-180},
 {x:32900,top:-520,bottom:360},{x:34000,top:-980,bottom:-520},{x:34800,top:-1510,bottom:-980},
 {x:40900,top:surface(40900)-45,bottom:1680},{x:44900,top:1450,bottom:3090},
 {x:98500,top:-900,bottom:surface(98500)},{x:101000,top:-900,bottom:surface(101000)},
 {x:103700,top:-1900,bottom:-900},{x:104800,top:-1900,bottom:-900},{x:108000,top:-3000,bottom:-1900},{x:109000,top:-3000,bottom:-1900},
 {x:111500,top:-4080,bottom:-3000},{x:112500,top:-4080,bottom:-3000},{x:114500,top:-5310,bottom:-4080},{x:115500,top:-5310,bottom:-4080},
 {x:121800,top:-3820,bottom:-2420},{x:126000,top:-2420,bottom:300}
];
export function cave(x,y){
 // Connected excavated shaft and sloping gallery, plus caverns.
 if(Math.abs(x-40900)<68&&y>surface(x)-70&&y<1640)return true;
 if(x>40850&&x<45300&&Math.abs(y-(1040+(x-40900)*.11))<95)return true;
 if(((x-43700)/710)**2+((y-1460)/190)**2<1)return true;
 if(Math.abs(x-44900)<64&&y>1400&&y<2990)return true;
 if(((x-45100)/1050)**2+((y-2820)/240)**2<1)return true;
 return false;
}
export const bridgeY=x=>{const t=clamp((x-50300)/3400,0,1);return surface(50300)*(1-t)+surface(53700)*t-Math.sin(t*Math.PI)*80;};
const platformAt=(x,y)=>PLATFORMS.find(p=>x>=p.x1&&x<=p.x2&&y>=p.y&&y<p.y+Math.max(96,p.depth));
const rampAt=(x,y)=>RAMPS.find(r=>{if(x<Math.min(r.x1,r.x2)||x>Math.max(r.x1,r.x2))return false;const t=(x-r.x1)/(r.x2-r.x1),ry=r.y1+(r.y2-r.y1)*t;return y>=ry&&y<ry+TILE;});
const moundAt=(x,y)=>MOUNDS.find(m=>{const top=upperSurface(x,m.base);return Math.abs(x-m.cx)<m.r&&y>=top&&y<m.base;});
export const isMineable=(x,y)=>x>40780&&x<45450&&y>surface(x)+70&&cave(x,y);
export function tileAt(tx,ty){const x=(tx+.5)*TILE,y=(ty+.5)*TILE;
 if(x<0||x>WIDTH||y>BOTTOM)return 2;if(y<TOP)return 0;
 // Real floating land, not a backdrop or an entry trigger.
 if(((x-119200)/1150)**2+((y+6870)/180)**2<1&&y> -7050)return y< -6980?1:2;
 const mound=moundAt(x,y);if(mound)return y<upperSurface(x,mound.base)+42?1:2;
 if(platformAt(x,y)||rampAt(x,y))return 4;
 const ground=surface(x);if(Math.abs(x-40900)<90&&Math.floor(y/TILE)===Math.ceil(surface(40900)/TILE))return 4;
 if(x>50300&&x<53700&&y>=bridgeY(x)&&y<bridgeY(x)+TILE)return 2;
 if(x>50500&&x<53500&&y>=470&&y<ground+140)return 6;
 if(y<ground)return 0;if(cave(x,y))return 0;
 if(y<ground+80)return 1;
 return hash(tx,ty)>.967&&y>ground+200?3:2;
}
export class Terrain{
 constructor(edits=[]){this.route='front';this.chunks=new Map();this.edits=new Map(edits);this.active=new Set();this.generated=0;}
 setRoute(route){if(this.route!==route){this.route=route;this.chunks.clear();}}
 get(tx,ty){const x=(tx+.5)*TILE,y=(ty+.5)*TILE;if(mountainZone(x)){const h=sceneGround(x);if(y>=h)return y<h+72?1:2;for(const l of WALKABLE){const sy=pathY(l,x-ORIGIN);if(sy!==null&&y>=sy&&y<sy+24)return 4;}return 0;}const key=tx+','+ty;if(this.edits.has(key))return this.edits.get(key);return tileAt(tx,ty);}
 solid(tx,ty){const t=this.get(tx,ty);return t===1||t===2||t===3;}
 set(tx,ty,t){this.edits.set(tx+','+ty,t);const cx=Math.floor(tx/CHUNK),cy=Math.floor(ty/CHUNK),c=this.chunks.get(cx+','+cy);if(c)c.tiles[(ty-cy*CHUNK)*CHUNK+tx-cx*CHUNK]=t;}
 chunk(cx,cy){const key=cx+','+cy;let c=this.chunks.get(key);if(c){this.chunks.delete(key);this.chunks.set(key,c);return c;}const tiles=new Uint8Array(CHUNK*CHUNK);for(let y=0;y<CHUNK;y++)for(let x=0;x<CHUNK;x++)tiles[y*CHUNK+x]=this.get(cx*CHUNK+x,cy*CHUNK+y);c={cx,cy,tiles};this.chunks.set(key,c);this.generated++;while(this.chunks.size>64)this.chunks.delete(this.chunks.keys().next().value);return c;}
 visible(left,top,right,bottom){const result=[];this.active.clear();for(let cy=Math.floor(top/TILE/CHUNK);cy<=Math.floor(bottom/TILE/CHUNK);cy++)for(let cx=Math.floor(left/TILE/CHUNK);cx<=Math.floor(right/TILE/CHUNK);cx++){this.active.add(cx+','+cy);result.push(this.chunk(cx,cy));}return result;}
}
export function groundLevel(x,start=surface(x)-TILE){const tx=Math.floor(x/TILE);for(let ty=Math.floor(start/TILE);ty<Math.ceil(BOTTOM/TILE);ty++){const t=tileAt(tx,ty);if([1,2,3,4].includes(t))return ty*TILE;}return surface(x);}
export function buildings(state){const out=[];const add=(id,x,name,owner,type='house',width=110,height=86,y)=>out.push({id,x,y:y??groundLevel(x,surface(x)-TILE),name,owner,type,width,height,ruined:owner&&state.factions[owner]?.status==='destroyed'});
 add('home',2200,'客舍','village');add('village-shop',2540,'村中杂货铺','village','shop');
 add('west-wall',11200,'临河西门','city','gate',210,270,surface(11200));add('inn',12600,'临河酒楼','city','inn',190,150,120);add('store',13900,'东市商铺','city','shop',160,110,-180);add('hall',15300,'城主府','city','hall',260,210,-480);add('east-wall',16900,'临河东门','city','gate',210,270,surface(16900));
 add('small-gate',32900,'松崖山门','small','gate',170,180,-520);add('small-hall',34500,'松崖大殿','small','hall',210,170,-1510);add('garden',35500,'悬崖药园','small','garden',250,60,-980);
 add('mine-office',40700,'矿场账房',state.mineOwner,'house',110,90);
 add('large-gate',101000,'玄岳山门','large','gate',250,230,-900);add('outer-hall',106000,'外门弟子居','large','hall',220,150,-1900);add('sword-pavilion',110000,'悬剑台','large','hall',190,165,-3000);add('dan-pavilion',121000,'丹崖','large','hall',190,165,-3820);add('main-hall',116000,'玄岳主殿','large','hall',330,270,-5310);add('cave-house',113000,'太上洞府','large','house',150,105,-4080);
 add('cloud-house',119150,'云台','large','hall',185,130,-7050);
 add('ruin-hall',43700,'无主旧殿',null,'ruin',260,150,1600);
 for(const [id,f]of Object.entries(state.factions)){if(id==='village'||id==='city')continue;const count=Math.min(5,Math.floor(f.buildingFund/100));for(let j=0;j<count;j++){const ys=id==='small'?[-520,-980,-980,-1510,-1510]:[-900,-1900,-3000,-4080,-3820];add(id+'-annex-'+j,(id==='small'?33300:100800)+j*(id==='small'?500:4200),'新建弟子舍',id,'house',115,85,ys[j]);}}
 for(const b of out)if(mountainZone(b.x)){const sites={'large-gate':[350,1],'outer-hall':[3100,2],'sword-pavilion':[1250,4],'dan-pavilion':[6150,6],'main-hall':[4500,7],'cave-house':[3750,5],'cloud-house':[4050,5]};const site=sites[b.id]||[5100+(Number(b.id.at(-1))||0)*180,3];b.x=ORIGIN+sceneX(site[0]);b.y=pathY(LEDGES[site[1]],sceneX(site[0]));b.route='front';}
 return out;
}
export class Simulation{
 constructor(saved){this.year=742;this.month=0;this.mineOwner='small';this.mineStock=40;this.consumed=0;this.mineRemaining=6000;this.ore=0;this.roadOpen=true;this.refugees=0;this.cityStock=25;this.history=[];this.factions={village:{name:'河畔村',people:32,wealth:45,buildingFund:0,status:'active'},city:{name:'临河城',people:320,wealth:400,buildingFund:0,status:'active'},small:{name:'松崖门',people:22,wealth:60,buildingFund:0,status:'active'},large:{name:'玄岳仙门',people:160,wealth:480,buildingFund:0,status:'active'}};if(saved)Object.assign(this,saved);}
 log(text,kind='economy'){this.history.push({year:this.year,month:this.month+1,text,kind});if(this.history.length>180)this.history.shift();}
 tick(){
 const owner=this.factions[this.mineOwner];const production=Math.min(this.mineRemaining,owner.status==='active'?3:0);this.mineRemaining-=production;this.mineStock+=production;
 const shipment=this.roadOpen?Math.min(4,this.mineStock):0;this.mineStock-=shipment;this.cityStock+=shipment;
 const used=Math.min(2.7,this.cityStock);this.cityStock-=used;this.consumed+=used;
 for(const [id,f]of Object.entries(this.factions)){if(f.status==='destroyed')continue;const income=id===this.mineOwner?shipment*2: id==='large'?9:id==='city'?(this.roadOpen?16:1):id==='small'?.1:2;const upkeep=f.people*.045;f.wealth+=income-upkeep;
  if((id==='small'||id==='large')&&f.wealth>120&&f.buildingFund<500){const spend=Math.min(3,f.wealth-100,500-f.buildingFund);f.wealth-=spend;const before=Math.floor(f.buildingFund/100);f.buildingFund+=spend;if(Math.floor(f.buildingFund/100)>before)this.log(f.name+'扩建弟子居所','building');}
  if(f.wealth<0){f.wealth=0;if(f.people>1){f.people--;this.refugees++;}}
 }
 const small=this.factions.small,large=this.factions.large;
 if(this.mineOwner==='small'&&small.wealth<10&&large.wealth>200&&large.people>small.people*4){this.mineOwner='large';large.wealth-=80;small.people=Math.max(0,small.people-8);this.refugees+=8;this.log('松崖门无力守矿，玄岳仙门接管矿场，弟子流亡','conflict');}
 if(small.status==='active'&&small.people<5){small.status='destroyed';this.log('松崖门解散，山门与大殿成为遗址','ruin');}
 if(this.refugees>0&&this.cityStock>5){const migrants=Math.min(2,this.refugees);this.refugees-=migrants;this.factions.city.people+=migrants;}
 this.month++;if(this.month===12){this.month=0;this.year++;}
 }
 advance(years){for(let i=0;i<years*12;i++)this.tick();}
 get price(){return Math.round(10*(1+Math.max(0,25-this.cityStock)/12));}
 extract(){if(this.mineRemaining<1)return false;this.mineRemaining--;this.ore++;return true;}
 donate(){if(this.ore<5)return false;this.ore-=5;this.consumed+=5;this.factions.small.wealth+=30;this.log('游历者向松崖门捐赠5份矿石，补充宗门经费','player');return true;}
 toggleRoad(){this.roadOpen=!this.roadOpen;this.log('观察干预：商路'+(this.roadOpen?'恢复':'中断'),'experiment');}
}
