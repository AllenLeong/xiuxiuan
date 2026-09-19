// Presentation of an edit uses its recorded before/after facts, never the preceding simulation tick.
export function editTransfers(d){
 if(d.ledgerSpan!==0)return null;
 const event=d.events?.findLast(e=>e.type==='人工干预'&&e.step===d.step&&e.year===d.year);
 const rows=[];
 if(!event)return{rows:[['人工净增减',d.flows.edit]],unknown:true};
 if(event.cmd.kind==='death'){
  const before=event.before?.detritus,after=event.after?.detritus;
  rows.push(['死亡 → 遗骸',Number.isFinite(before)&&Number.isFinite(after)?after-before:null]);
 }else if(event.cmd.kind==='remove')rows.push(['植物 → 世界外',-d.flows.edit]);
 else if(event.cmd.kind==='trait'){
  const before=event.before?.detritus,after=event.after?.detritus;
  if(Number.isFinite(before)&&Number.isFinite(after)&&after>before)rows.push(['承载缩减 → 遗留物',after-before]);
 }
 rows.push(['人工净增减',d.flows.edit]);return{rows,unknown:rows.some(([,v])=>!Number.isFinite(v))};
}
