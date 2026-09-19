// Capability coefficients are independent; qi units are abstract and time is years.
export const SPECIES=[
 {name:'旱原草',layer:0,spirit:false,temp:23,tol:24,water:.24,wt:.4,light:.85,shade:.05,size:1,life:4,growth:.9,fertility:.65,need:0,tolerance:500,process:0,absorb:0,root:0,release:.12,capacity:.4,color:'#a6ac66'},
 {name:'阴蕨',layer:0,spirit:false,temp:17,tol:18,water:.65,wt:.38,light:.3,shade:.03,size:1.2,life:7,growth:.6,fertility:.5,need:0,tolerance:500,process:0,absorb:0,root:0,release:.08,capacity:.8,color:'#638466'},
 {name:'凝露草',layer:0,spirit:true,temp:19,tol:20,water:.55,wt:.45,light:.6,shade:.05,size:1,life:12,growth:.6,fertility:.5,need:2,tolerance:350,process:.12,absorb:.13,root:0,release:.24,capacity:4,color:'#8cbd9a'},
 {name:'敛灵苔',layer:0,spirit:true,temp:14,tol:22,water:.7,wt:.45,light:.3,shade:.02,size:.8,life:18,growth:.4,fertility:.4,need:4,tolerance:450,process:.02,absorb:.65,root:.08,release:.015,capacity:14,color:'#507e76'},
 {name:'山松',layer:1,spirit:false,temp:15,tol:26,water:.35,wt:.45,light:.8,shade:.55,size:1.5,life:180,growth:.06,fertility:.09,need:0,tolerance:600,process:0,absorb:0,root:0,release:.015,capacity:6,color:'#435e48'},
 {name:'泽榆',layer:1,spirit:false,temp:21,tol:20,water:.7,wt:.4,light:.65,shade:.75,size:1.8,life:140,growth:.08,fertility:.12,need:0,tolerance:500,process:0,absorb:0,root:0,release:.02,capacity:7,color:'#55734f'},
 {name:'天青灵树',layer:1,spirit:true,temp:21,tol:23,water:.55,wt:.5,light:.75,shade:.85,size:2,life:480,growth:.08,fertility:.06,need:1,tolerance:700,process:5,absorb:.1,root:.08,release:.15,capacity:100,color:'#366f69'},
 {name:'地髓古榕',layer:1,spirit:true,temp:43,tol:32,water:.35,wt:.55,light:.7,shade:.95,size:2.5,life:650,growth:.07,fertility:.045,need:3,tolerance:900,process:0,absorb:.1,root:2.5,release:.1,capacity:140,color:'#866849'}
];
export const DEFAULTS={dt:.25,escapeRate:.06,maturation:1,groundDiffusion:.12,surfaceDiffusion:.18,decompose:.12,feedback:1,mineralRate:.015,seedLife:12,ancientAge:90,ancientMass:3,climate:21,climateGradient:32,rain:.48,geothermal:1};
export const VERSION='0.2.0';
