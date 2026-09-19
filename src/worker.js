import {World} from './world.js';
import {scenario} from './scenarios.js';
let world=null,running=false,timer=null,selected=0,speed=4,last=0,busy=false,replyTo=null,targetYear=null,lastSentRegions=null,lastSentWorld=null,lastSentStep=-1,lastSentEdit=null;
function send(force=false){
 const now=performance.now();if(!force&&now-last<200)return;last=now;
 const edit=world.edits.at(-1),mapReset=lastSentWorld!==world,edited=lastSentEdit!==edit,mapChanged=mapReset||edited||lastSentStep!==world.steps;
 const map={};if(mapChanged){world.refreshTotals();for(const k of ['groundEast','groundSouth','airEast','airSouth','temp','water','ground','air','mineral','type','count','mass','qi','stage'])map[k]=world[k];}
 if(mapReset||edited)for(const k of ['height','river','lakeDepth','drainage','rock','heat','sun','province'])map[k]=world[k];
 postMessage({type:'state',replyTo,size:world.size,seed:world.seed,year:world.year,steps:world.steps,config:world.config,edgeFlowStep:world.edgeFlowStep,map,mapChanged,mapReset,...(lastSentRegions!==world.regions?{regions:world.regions}:{}),qiChannels:world.qiChannels,terrainFeatures:world.terrainFeatures,ancients:world.ancients,summary:world.summary,audit:world.lastAudit,events:world.events.slice(-60),dropped:world.droppedEvents,targetYear,selected:world.inspect(Math.min(selected,world.n-1)),running});
 lastSentRegions=world.regions;lastSentWorld=world;lastSentStep=world.steps;lastSentEdit=edit;replyTo=null;
}
function loop(){if(!running||!world)return;const start=performance.now();do{world.step();if(targetYear!==null&&world.year>=targetYear){running=false;targetYear=null;}}while(performance.now()-start<Math.min(35,speed*3)&&running);send(!running);if(running)timer=setTimeout(loop,Math.max(0,120/speed));}
onmessage=async({data:d})=>{try{if(busy&&d.type!=='generate')return;replyTo=d.requestId;
 if(d.type==='generate'){targetYear=null;busy=true;running=false;clearTimeout(timer);postMessage({type:'progress',text:'生成地形、岩层与初始种群…'});if(d.scenario){const experiment=scenario(d.scenario,d.variant);world=experiment.world;selected=experiment.center;}else{world=new World(d.size,d.seed,d.config);selected=0;}if(d.prewarm){postMessage({type:'progress',text:'预运行中…'});for(let t=0;t<d.prewarm/world.config.dt;t++){world.step();if(t%4===0)await new Promise(r=>setTimeout(r,0));}}busy=false;send(true);}
 else if(d.type==='advance'){if(!world)throw Error('请先生成或载入世界');if(!Number.isFinite(d.years)||d.years<=0||d.years>10000||Math.abs(d.years/world.config.dt-Math.round(d.years/world.config.dt))>1e-8)throw Error('年数必须是步长的整数倍，最多 10000 年');targetYear=world.year+d.years;running=true;speed=64;clearTimeout(timer);send(true);loop();}
 else if(d.type==='play'){if(!world)return;running=!running;clearTimeout(timer);send(true);if(running)loop();}
 else if(d.type==='pause'){running=false;targetYear=null;clearTimeout(timer);send(true);}
 else if(d.type==='step'){running=false;targetYear=null;clearTimeout(timer);world.step();send(true);}
 else if(d.type==='speed'){speed=d.value;}
 else if(d.type==='select'){selected=d.i;send(true);}
 else if(d.type==='edit'){running=false;targetYear=null;clearTimeout(timer);world.edit(d.cmd);send(true);postMessage({type:'notice',text:'修改已生效，并记录于干预日志'});}
 else if(d.type==='save'){postMessage({type:'save',replyTo,data:world.serialize()});}
 else if(d.type==='load'){const loaded=World.load(d.data);running=false;targetYear=null;clearTimeout(timer);world=loaded;selected=0;send(true);}
}catch(e){busy=false;postMessage({type:'error',action:d.type,replyTo,text:e.message});}};
