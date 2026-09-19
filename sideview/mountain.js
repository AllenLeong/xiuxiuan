// All three profiles are physical surfaces of the same mountain, seen at
// different depths. Junctions share coordinates, so changing depth never lifts
// a traveller to a higher altitude.
export const MOUNTAIN_ROUTES={
 front:{name:'前山 · 登峰山道',points:[[94000,482.0031445301925],[98000,250],[101000,-900],[104000,-1650],[107000,-2200],[110000,-3300],[113000,-4350],[116000,-5310],[118000,-5700],[121000,-3820],[124000,-2450],[128000,-700],[132000,420],[135000,443.7950134605004]]},
 forest:{name:'山中 · 密林谷道',points:[[94000,482.0031445301925],[98000,250],[101000,100],[104000,-100],[107000,-400],[110000,-100],[113000,-220],[116000,-480],[119000,-250],[122000,20],[125000,-180],[128000,200],[132000,420],[135000,443.7950134605004]]},
 rear:{name:'后山 · 溪谷绕行',points:[[94000,482.0031445301925],[98000,250],[101000,350],[105000,510],[109000,320],[113000,100],[117000,390],[121000,500],[125000,280],[128000,340],[132000,420],[135000,443.7950134605004]]}
};
export const mountainZone=x=>x>=94000&&x<=135000;
export function routeHeight(x,route='front'){
 const points=(MOUNTAIN_ROUTES[route]||MOUNTAIN_ROUTES.front).points;
 if(x<=points[0][0])return points[0][1];
 for(let i=1;i<points.length;i++){const [b,by]=points[i];if(x>b)continue;const [a,ay]=points[i-1],u=(x-a)/(b-a);return ay+(by-ay)*(u*u*(3-2*u));}
 return points.at(-1)[1];
}
export const ROUTE_JUNCTIONS=[{x:98000,y:250,name:'西麓三岔口'},{x:132000,y:420,name:'东麓三岔口'}];
export function junctionNear(p){return ROUTE_JUNCTIONS.find(j=>Math.abs(p.x-j.x)<120&&Math.abs(p.y-j.y)<90);}
