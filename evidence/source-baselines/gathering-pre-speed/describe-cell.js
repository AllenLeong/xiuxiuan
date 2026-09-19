import {SPECIES} from './species.js';
export const QI_BANDS=[{min:0,max:1,label:'贫灵'},{min:1,max:4,label:'微灵'},{min:4,max:12,label:'灵润'},{min:12,max:35,label:'富灵'},{min:35,max:Infinity,label:'高度富集'}];
export function describeCell(d){
 const altitude=d.height,relief=d.relief||0;
 let terrain;
 if(altitude<.23)terrain=altitude<.10?'深海':'近岸浅海';
 else if((d.lakeDepth||0)>.012)terrain='内陆湖泊';
 else if(d.river>.55&&relief>.045)terrain='深切河谷';
 else if(d.river>.15)terrain='河谷';
 else if(altitude>.76)terrain='高山';
 else if(altitude>.58)terrain='山地';
 else if(d.water>.73&&altitude<.43)terrain='湿地';
 else if(altitude<.275)terrain='海岸低地';
 else if(relief>.025||altitude>.43)terrain='丘陵';
 else terrain='平原';
 if(d.landform)terrain=d.landform;
 if(terrain==='平原'&&d.water>.73)terrain='湿地平原';
 const thermal=d.temp<0?'冰寒':d.temp<12?'寒凉':d.temp<26?'温和':d.temp<38?'炎热':'酷热';
 const moisture=d.water<.2?'干旱':d.water<.4?'偏干':d.water<.7?'湿润':'潮湿';
 const living=d.plants.filter(p=>p.count>0),tree=d.plants[1],grass=d.plants[0];
 let ecosystem='暂时无植被';if(living.length){if(tree?.ancient)ecosystem='古灵树'+(grass.count?'与草地共存':'独立生长');else if(tree.count&&grass.count)ecosystem='乔木与草地共存';else if(tree.count)ecosystem=SPECIES[tree.type].spirit?'灵树林地':'普通林地';else ecosystem=SPECIES[grass.type].spirit?'灵草群落':'普通草地';}
 if(altitude<.23||(d.lakeDepth||0)>.012)ecosystem='水域；首版未模拟水生生物';
 const grade=QI_BANDS.findIndex(b=>d.air>=b.min&&d.air<b.max),band=QI_BANDS[grade>=0?grade:0];
 const stages=living.filter(p=>SPECIES[p.type].spirit).map(p=>p.stage||0),plantStage=stages.length?Math.max(...stages):null;
 const net=d.after-d.before,epsilon=1e-8*Math.max(1,d.before);
 const change=d.ledgerSpan===0?'本次人工干预':d.year===0?'初始状态，尚未推演':Math.abs(net)<=epsilon?'最近一步总量接近平衡':net>0?'最近一步灵气净积累':'最近一步灵气净流出';
 const allStored=d.ground+d.mineral+d.soil+d.detritus+living.reduce((s,p)=>s+p.qi,0),surfaceShare=d.air/Math.max(1e-9,allStored+d.air);
 const storage=allStored>d.air*5?'灵气主要储存在地下或载体中':surfaceShare>.5?'灵气主要游离在地表':'游离与储存并存';
 return{features:d.landformFeatures||[],reasons:d.landformReasons||[],terrain,thermal,moisture,ecosystem,grade:Math.max(0,grade),gradeName:band.label,gradeRange:`${band.min}—${Number.isFinite(band.max)?band.max:'∞'} 单位 / 格`,plantStage,change,storage,net,title:`${thermal}${terrain} · ${ecosystem}`};
}
