const pools=['ground','air','mineral','soil','detritus'];
export function auditSnapshot(w){return Object.fromEntries([...pools,'qi'].map(f=>[f,w[f].slice()]));}
export function auditStep(w,before){
 const f=w.flows,result={invalid:0,negative:0,capacity:0,budget:0,maxRelativeError:0,firstFailure:null};
 const fail=(kind,i,detail)=>{result[kind]++;result.firstFailure??={kind,i,detail};};
 const check=(name,i,old,value,net)=>{
  if(!Number.isFinite(value)||!Number.isFinite(net)){fail('invalid',i,name);return;}
  if(value< -1e-9)fail('negative',i,name);
  const relative=Math.abs(value-old-net)/Math.max(1,Math.abs(old)+Math.abs(net));result.maxRelativeError=Math.max(result.maxRelativeError,relative);
  if(relative>1e-8)fail('budget',i,{name,old,value,net,relative});
 };
 for(let i=0;i<w.n;i++){
  const mineral=w.mineral[i]-before.mineral[i];
  check('ground',i,before.ground[i],w.ground[i],f.geology[i]+f.groundIn[i]-f.groundOut[i]-f.vent[i]-f.root[i]-mineral);
  check('air',i,before.air[i],w.air[i],f.surfaceIn[i]-f.surfaceOut[i]+f.vent[i]-f.absorb[i]+f.release[i]+f.decompose[i]-f.bind[i]+mineral+f.weather[i]-f.escape[i]);
  check('soil',i,before.soil[i],w.soil[i],f.bind[i]-mineral-f.weather[i]);
  check('detritus',i,before.detritus[i],w.detritus[i],f.litter[i]+f.death[i]-f.decompose[i]);
  check('plants',i,before.qi[i*2]+before.qi[i*2+1],w.qi[i*2]+w.qi[i*2+1],f.processing[i]+f.root[i]+f.absorb[i]-f.release[i]-f.litter[i]-f.death[i]);
  if(!Number.isFinite(w.mineral[i]))fail('invalid',i,'mineral');
  if(w.mineral[i]<0||mineral< -1e-9)fail('negative',i,'mineral');
  if(w.air[i]>w.airCapacity[i]+1e-7||w.soil[i]>w.soilCapacity[i]+1e-7)fail('capacity',i,'surface');
  if(w.ground[i]>w.capacity[i]+1e-7||w.mineral[i]>w.capacity[i]*2+1e-7)fail('capacity',i,'geology');
  for(let l=0;l<2;l++){
   const k=i*2+l;
   for(const name of ['mass','qi','life']){const v=w[name][k];if(!Number.isFinite(v))fail('invalid',i,name);if(v< -1e-9)fail('negative',i,name);}
   if(w.count[k]&&w.qi[k]>w.mass[k]*w.s(k).capacity+1e-7)fail('capacity',i,'plant');
  }
 }
 const a=w.lastAudit,relative=Math.abs(a.error)/Math.max(1,Math.abs(a.before)+Math.abs(a.input)+Math.abs(a.escaped));
 result.maxRelativeError=Math.max(result.maxRelativeError,relative);if(relative>1e-8)fail('budget',-1,'global');
 return result;
}
