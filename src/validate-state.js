// Validate loaded snapshots before they can replace the live world.
export function validateState(w){
 const fail=message=>{throw Error('存档状态不一致：'+message);};
 for(const k of ['dt','groundDiffusion','surfaceDiffusion','decompose','feedback','mineralRate','seedLife','ancientAge','ancientMass','climateGradient','geothermal'])if(!Number.isFinite(w.config[k])||w.config[k]<0)fail(k);
 if(w.config.dt<=0||w.config.dt>1||![0,1].includes(w.config.maturation)||w.config.rain<0||w.config.rain>1)fail('配置范围');
 for(const s of w.species){for(const k of ['life','size','tol','wt','tolerance'])if(s[k]<=0)fail('物种 '+k);for(const k of ['growth','fertility','need','process','absorb','root','release','capacity'])if(s[k]<0)fail('物种 '+k);}
 const countType=w.count instanceof Uint32Array,typeType=w.type instanceof Int16Array,cohortType=w.cohortCount instanceof Uint32Array;
 if(!countType||!typeType||!cohortType)fail('种群数组类型');
 for(let i=0;i<w.n;i++){
  if(!Number.isFinite(w.airCapacity[i])||w.airCapacity[i]<=0||w.air[i]>w.airCapacity[i]+1e-7||!Number.isFinite(w.soilCapacity[i])||w.soilCapacity[i]<0||w.soil[i]>w.soilCapacity[i]+1e-7)fail('地表或结合容量');
  for(const rate of ['soilBindRate','soilReleaseRate'])if(!Number.isFinite(w[rate][i])||w[rate][i]<0||w[rate][i]>1)fail('结合速率');
  for(const f of ['groundGatherRate','gatherRate','sourceMean','throughputMean','gatherMean'])if(!Number.isFinite(w[f][i])||w[f][i]<0)fail('聚气/观测速率');if(!Number.isFinite(w.gatherLimit[i])||w.gatherLimit[i]<=0)fail('聚气上限');
  if(w.capacity[i]<=0||w.ground[i]>w.capacity[i]+1e-7)fail('地下容量');
  for(const f of ['surfaceNorth','surfaceSouth','surfaceWest','surfaceEast','height','rock','sun','baseWater','water','efficiency','conduct','outlet'])if(w[f][i]<0||w[f][i]>1)fail(f+' 范围');
  if(w.lakeDepth[i]<0)fail('湖水深度');
  if(w.receive[i]<0||w.production[i]<0||w.mineralTime[i]<0||w.heat[i]<0)fail('地质速率');
  const to=w.drainage[i];if(!Number.isInteger(to)||to< -1||to>=w.n||to===i||w.catchment[i]<0)fail('水系索引');
  for(let l=0;l<2;l++){
   const k=i*2+l,type=w.type[k],count=w.count[k],a=w.ancients[k];
   if(count===0){if(type!==-1||w.mass[k]!==0||w.qi[k]!==0||w.life[k]!==0)fail('空种群残余');}
   else if(!w.species[type]||w.species[type].layer!==l)fail('物种层');
   if(w.age[k]<0||w.maturity[k]<0||w.stage[k]>1000)fail('年龄或阶段');
   let cohorts=0;for(let b=0;b<8;b++)cohorts+=w.cohortCount[k*8+b];
   if(cohorts+(a?1:0)!==count)fail('出生批次数量');
   if(a&&(a.mass>w.mass[k]+1e-7||a.qi>w.qi[k]+1e-7||a.life>w.life[k]+1e-7))fail('古树重复或超出种群');
   if(count&&(!Number.isFinite(w.mass[k]*w.s(k).capacity)||w.qi[k]>w.mass[k]*w.s(k).capacity+1e-7))fail('植物承载');
  }
 }
 for(const f of w.terrainFeatures)if(f.x<0||f.x>=w.size||f.y<0||f.y>=w.size||f.label.length>80)fail('地形标注');
}
