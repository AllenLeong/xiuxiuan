import {moveScene,sceneGround} from './mountain-scene.js';
import {mountainZone,routeHeight} from './mountain.js';
import {TILE,WIDTH,TOP,BOTTOM,surface,LADDERS,MODES} from './world.js';
export function spawn(x=2200){return{x,route:'front',y:(mountainZone(x)?routeHeight(x):surface(x))-70,vx:0,vy:0,w:18,h:38,grounded:false,mode:'walk',flying:false,energy:100,facing:1,inside:null};}
export function overlaps(p,t){if(mountainZone(p.x))return p.y>sceneGround(p.x)+.1;const x0=Math.floor((p.x-p.w/2)/TILE),x1=Math.floor((p.x+p.w/2-.01)/TILE),y0=Math.floor((p.y-p.h)/TILE),y1=Math.floor((p.y-.01)/TILE);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(t.solid(x,y))return true;return false;}
export function move(p,t,input,dt){const cfg=MODES[p.mode];dt=Math.min(dt,.033);if(mountainZone(p.x)){moveScene(p,input,dt,cfg);if(!mountainZone(p.x)&&!p.flying&&p.y>surface(p.x)-30)p.y=Math.ceil(surface(p.x)/TILE-.5)*TILE;return {ladder:false,water:false};}const direction=(input.right?1:0)-(input.left?1:0);if(direction)p.facing=direction;const ladder=!mountainZone(p.x)&&LADDERS.find(l=>Math.abs(l.x-p.x)<56&&p.y>l.top&&p.y-p.h<l.bottom);const water=t.get(Math.floor(p.x/TILE),Math.floor((p.y-10)/TILE))===6;
 if(input.toggleFlight){p.flying=!!cfg.fly&&!p.flying;}
 p.vx=direction*(p.flying?cfg.fly:cfg.speed)*(water?.55:1);
 if(ladder&&(input.up||input.down)&&!p.flying){p.vy=((input.down?1:0)-(input.up?1:0))*125;p.energy=Math.min(cfg.stamina,p.energy+dt*8);}
 else if(p.flying&&p.energy>0){p.vy=((input.down?1:0)-(input.up||input.jump?1:0))*cfg.fly;p.energy=Math.max(0,p.energy-dt*(p.mode==='sword'?4:8)*(1+Math.max(0,-p.y-1500)/1500));if(p.energy===0)p.flying=false;}
 else{p.vy+=dt*(water?220:980);if(input.jump&&(p.grounded||water)){p.vy=water?-170:-cfg.jump;p.grounded=false;}if(p.grounded)p.energy=Math.min(cfg.stamina,p.energy+dt*22);}
 // Substeps prevent tunnelling at sword-flight speed. Walking can step one tile.
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(p.vx),Math.abs(p.vy))*dt/8)),dx=p.vx*dt/steps,dy=p.vy*dt/steps;let landed=false;
 for(let k=0;k<steps;k++){
  const oldX=p.x,oldGround=mountainZone(p.x)?routeHeight(p.x,p.route):null;p.x=Math.max(p.w/2,Math.min(WIDTH-p.w/2,p.x+dx));if(oldGround!==null&&mountainZone(p.x)&&p.grounded&&!p.flying&&!input.jump){p.y+=routeHeight(p.x,p.route)-oldGround;}if(overlaps(p,t)){const oldY=p.y;if(p.grounded&&!p.flying){p.y-=TILE;if(overlaps(p,t)){p.x=oldX;p.y=oldY;}}else p.x=oldX;}
  const oldY=p.y;p.y+=dy;
  if(dy>=0&&!(ladder&&input.down)){
   const row=Math.floor(p.y/TILE);for(let tx=Math.floor((p.x-p.w/2)/TILE);tx<=Math.floor((p.x+p.w/2)/TILE);tx++)if(t.get(tx,row)===4&&oldY<=row*TILE+.1&&p.y>=row*TILE){p.y=row*TILE;landed=true;p.vy=0;break;}
  }
  if(overlaps(p,t)){p.y=oldY;if(dy>0)landed=true;p.vy=0;}
 }
 p.grounded=landed;p.y=Math.max(TOP+p.h,Math.min(BOTTOM-20,p.y));if(p.y>=BOTTOM-20){p.x=2200;p.y=surface(2200)-70;p.vy=0;}
 return {ladder:!!ladder,water};
}
export function relocate(p,x,y){Object.assign(p,spawn(x),{y:y??surface(x)-70,mode:p.mode,energy:MODES[p.mode].stamina});}
