// Explicit diagnostic workload, started from the help panel. Uses the normal renderer.
export function cameraExercise(map,diagnostics,onFinish){
 const previous={zoom:map.zoom,ox:map.ox,oy:map.oy,autoFit:map.autoFit},start=performance.now();
 diagnostics.begin();let ended=false;
 map.beforeFrame=time=>{
  const seconds=(time-start)/1000;
  if(seconds>=60){ended=true;map.beforeFrame=null;Object.assign(map,previous);map.dirty=true;onFinish();return;}
  const n=map.state.size,base=Math.min((map.width-170)/n,(map.height-38)/n),zoom=base*(1.1+2.1*(.5-.5*Math.cos(seconds*.22)));
  const cx=n*(.5+.2*Math.sin(seconds*.31)),cy=n*(.5+.2*Math.cos(seconds*.23));
  map.zoom=zoom;map.ox=map.width*.5-cx*zoom;map.oy=map.height*.5-cy*zoom;map.autoFit=false;map.dirty=true;
 };
 return()=>{if(ended)return;ended=true;map.beforeFrame=null;Object.assign(map,previous);map.dirty=true;};
}
