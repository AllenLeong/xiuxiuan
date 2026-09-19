// Small native map symbols. Each mark represents measured surface or vegetation.
export function vegetationMark(ctx,x,y,species,mass,stage=0){
 const size=.40+Math.min(1.1,Math.sqrt(mass)*.32+stage*.07);ctx.fillStyle=species.color;ctx.strokeStyle='#263d3980';ctx.lineWidth=.16;
 ctx.beginPath();
 if(species.sprite===0||species.sprite===2){ctx.moveTo(x,y-size*2.1);ctx.lineTo(x-size*.75,y);ctx.lineTo(x+size*.75,y);}
 else if(species.sprite===7){ctx.ellipse(x,y-size,size*1.15,size*.48,0,0,Math.PI*2);}
 else{ctx.ellipse(x,y-size,size,size*.85,0,0,Math.PI*2);}
 ctx.closePath();ctx.fill();ctx.stroke();
}
export function surfaceMark(ctx,x,y,type){ctx.lineWidth=.20;ctx.strokeStyle='#554d4770';ctx.beginPath();
 if(type==='沙漠'){for(let k=0;k<3;k++){ctx.moveTo(x-2,y+k*.6);ctx.quadraticCurveTo(x,y-1+k*.6,x+2,y+k*.6);}}
 else if(type==='熔岩地'){ctx.strokeStyle='#f2a059';ctx.moveTo(x-1,y-2);ctx.lineTo(x+.4,y-.8);ctx.lineTo(x-.4,y+.1);ctx.lineTo(x+1.2,y+1.3);}
 else if(type==='雪原'||type==='冰盖'){ctx.strokeStyle='#fbfcf4a0';ctx.moveTo(x-1.5,y);ctx.lineTo(x+1.5,y);ctx.moveTo(x,y-1.5);ctx.lineTo(x,y+1.5);}
 else if(type==='草甸'||type==='旱原'){ctx.strokeStyle='#657d4870';for(let k=0;k<3;k++){ctx.moveTo(x+k*.6,y);ctx.lineTo(x+k*.6-.3,y-.8);}}
 else if(type==='峭壁'){for(let k=0;k<3;k++){ctx.moveTo(x+k*.8,y-2);ctx.lineTo(x+k*.8-.2,y+1);}}
 else if(type==='火山荒地'){ctx.strokeStyle='#332e3b80';ctx.moveTo(x-1,y);ctx.lineTo(x,y-1);ctx.lineTo(x+1,y);}
 ctx.stroke();}
