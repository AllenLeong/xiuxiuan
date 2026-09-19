// Multi-source geographic partition: terrain travel resistance, never used by qi rules.
export function partition(w){const n=w.size,total=w.n,dist=new Float64Array(total).fill(Infinity),heap=[];
 const push=(i,d,p)=>{let k=heap.length;heap.push({i,d,p});while(k){const a=(k-1)>>1;if(heap[a].d<=d)break;heap[k]=heap[a];k=a;}heap[k]={i,d,p};};
 const pop=()=>{const root=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let j=k*2+1;if(j+1<heap.length&&heap[j+1].d<heap[j].d)j++;if(heap[j].d>=last.d)break;heap[k]=heap[j];k=j;}heap[k]=last;}return root;};
 const seeds=[[.45,.5],[.22,.25],[.70,.3],[.23,.66],[.68,.65]];for(let p=0;p<seeds.length;p++){const [sx,sy]=seeds[p];let i=-1,best=Infinity;for(let y=Math.max(0,Math.floor((sy-.15)*n));y<Math.min(n,Math.ceil((sy+.15)*n));y++)for(let x=Math.max(0,Math.floor((sx-.15)*n));x<Math.min(n,Math.ceil((sx+.15)*n));x++){const j=y*n+x;if(w.height[j]<.25)continue;const score=Math.hypot(x/n-sx,y/n-sy)+Math.max(0,w.height[j]-.42)*.8+w.river[j]*.03;if(score<best){best=score;i=j;}}if(i>=0){dist[i]=0;push(i,0,p);}}

 while(heap.length){const{i,d,p}=pop();if(d!==dist[i])continue;w.province[i]=p;const x=i%n,y=(i/n)|0;for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1]){if(j<0)continue;const river=Math.max(w.river[i],w.river[j]),sea=w.height[i]<.21||w.height[j]<.21;const cost=1+Math.abs(w.height[i]-w.height[j])*45+Math.max(0,Math.max(w.height[i],w.height[j])-.65)*18+river*30+(sea?100:0);const nd=d+cost;if(nd<dist[j]){dist[j]=nd;push(j,nd,p);}}}
}
