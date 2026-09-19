// A single shared scene: exposed mountain faces, ledges and bridge connections.
// Coordinates are continuous; ledges represent paths on the front face of rock.
export const ORIGIN=104000;
export const sceneX=x=>x>=0&&x<=8500?x*1.5:x;
export const sceneY=y=>y<0?y*1.25:y;
export const LEDGES=[
 {id:'valley',kind:'ground',points:[[-10000,482.0031445301925],[-1000,440],[0,380],[1300,420],[2200,340],[3700,420],[4900,340],[6300,430],[8500,380],[31000,443.7950134605004]]},
 {id:'grove',kind:'land',points:[[200,-560],[650,-660],[1600,-640],[2100,-480]]},
 {id:'court',kind:'land',points:[[2500,-1150],[2900,-1240],[3800,-1240],[4100,-1150]]},
 {id:'forest',kind:'land',points:[[4750,-760],[5100,-850],[6250,-850],[6600,-720]]},
 {id:'west',kind:'land',points:[[550,-2050],[850,-2130],[1700,-2140],[2020,-2040]]},
 {id:'temple',kind:'land',points:[[3100,-2800],[3420,-2890],[4150,-2890],[4490,-2720]]},
 {id:'east',kind:'land',points:[[5700,-2270],[6000,-2360],[6740,-2360],[7100,-2160]]},
 {id:'peak',kind:'land',points:[[3900,-4080],[4230,-4200],[4750,-4200],[5000,-3950]]},
 {id:'bridge-low',kind:'bridge',points:[[2100,-480],[2500,-1150]]},
 {id:'bridge-high',kind:'bridge',points:[[2020,-2040],[2600,-1910],[3100,-2800]]},
 {id:'bridge-east',kind:'bridge',points:[[4490,-2720],[5080,-2460],[5700,-2270]]},
 {id:'stairs-1',kind:'stairs',points:[[0,380],[650,-660]]},
 {id:'stairs-2',kind:'stairs',points:[[1600,-640],[1700,-2140]]},
 {id:'stairs-3',kind:'stairs',points:[[3800,-1240],[4150,-2890]]},
 {id:'stairs-4',kind:'stairs',points:[[4150,-2890],[4750,-4200]]},
 {id:'stairs-east',kind:'stairs',points:[[6300,430],[6250,-850],[6740,-2360]]},
 {id:'bridge-mid',kind:'bridge',points:[[4100,-1150],[4420,-1000],[4750,-760]]}
];
// Expand traversable space, rather than scaling the player or merely zooming out.
for(const l of LEDGES)l.points=l.points.map(([x,y])=>[sceneX(x),sceneY(y)]);
export function pathY(path,x){const pts=path.points;if(x<pts[0][0]||x>pts.at(-1)[0])return null;for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){const [a,ay]=pts[i-1],[b,by]=pts[i];return ay+(by-ay)*(x-a)/(b-a);}}return pts.at(-1)[1];}
// Steep stairs have their own parameterisation and are traversed with W/S.
export const STAIR_LINKS=LEDGES.filter(l=>l.kind==='stairs');
export const WALKABLE=LEDGES.filter(l=>l.kind!=='stairs');
export const SCENE_CAVES=[{id:'mist-cave',name:'林崖洞',layer:'山麓',x:ORIGIN+1250,y:-645},{id:'sword-cave',name:'云壁洞',layer:'山腰',x:ORIGIN+3520,y:-1240},{id:'elder-cave',name:'高崖洞府',layer:'高山',x:ORIGIN+6390,y:-2360}];
for(const c of SCENE_CAVES){c.x=ORIGIN+sceneX(c.x-ORIGIN);c.y=sceneY(c.y);}
export function sceneGround(x){return pathY(LEDGES[0],x-ORIGIN)??440;}
export function stairNear(p,input={}){const x=p.x-ORIGIN;return STAIR_LINKS.find(l=>{const ys=l.points.map(v=>v[1]);if(input.up&&p.y<=Math.min(...ys)+.1||input.down&&p.y>=Math.max(...ys)-.1)return false;for(let i=1;i<l.points.length;i++){const [a,ay]=l.points[i-1],[b,by]=l.points[i],u=Math.max(0,Math.min(1,(p.y-ay)/(by-ay)));if(Math.abs(x-(a+(b-a)*u))<55&&p.y>=Math.min(ay,by)-35&&p.y<=Math.max(ay,by)+35)return true;}return false;});}
export function moveScene(p,input,dt,cfg){
 const direction=(input.right?1:0)-(input.left?1:0);if(direction)p.facing=direction;
 if(input.toggleFlight)p.flying=!!cfg.fly&&!p.flying;
 const stair=stairNear(p,input);
 if(stair&&(input.up||input.down)&&!p.flying){const min=Math.min(...stair.points.map(v=>v[1])),max=Math.max(...stair.points.map(v=>v[1]));p.y=Math.max(min,Math.min(max,p.y+((input.down?1:0)-(input.up?1:0))*230*dt));for(let i=1;i<stair.points.length;i++){const[a,ay]=stair.points[i-1],[b,by]=stair.points[i];if(p.y>=Math.min(ay,by)&&p.y<=Math.max(ay,by)){p.x=ORIGIN+a+(b-a)*(p.y-ay)/(by-ay);break;}}p.vy=0;p.grounded=true;return;}
 const oldX=p.x-ORIGIN,oldY=p.y;
 let support=null;if(p.grounded&&!p.flying)for(const l of WALKABLE){const y=pathY(l,oldX);if(y!==null&&Math.abs(y-p.y)<4){support=l;break;}}
 p.x+=direction*(p.flying?cfg.fly:cfg.speed)*dt;
 if(p.flying&&p.energy>0){p.y+=((input.down?1:0)-(input.up||input.jump?1:0))*cfg.fly*dt;p.energy=Math.max(0,p.energy-dt*5);p.vy=0;p.grounded=false;if(p.y>sceneGround(p.x)){p.y=sceneGround(p.x);p.grounded=true;}if(!p.energy)p.flying=false;return;}
 if(input.jump&&p.grounded){p.vy=-cfg.jump;p.grounded=false;support=null;}
 const next=support&&pathY(support,p.x-ORIGIN);if(next!==null&&next!==false&&support){p.y=next;p.vy=0;p.grounded=true;p.energy=Math.min(cfg.stamina,p.energy+dt*20);return;}
 p.vy+=980*dt;p.y+=p.vy*dt;p.grounded=false;
 if(p.vy>=0){let hit=Infinity;for(const l of WALKABLE){const y=pathY(l,p.x-ORIGIN);if(y!==null&&oldY<=y+3&&p.y>=y)hit=Math.min(hit,y);}if(hit!==Infinity){p.y=hit;p.vy=0;p.grounded=true;}}
}
