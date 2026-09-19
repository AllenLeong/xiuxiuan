import test from 'node:test';import assert from 'node:assert/strict';
import {boundaryGeometry,boundaryPaths} from '../src/map-boundaries.js';
class Path{moveTo(){}lineTo(){}}
test('coasts override contours and province lines apply only between land cells',()=>{
 const map={height:Float64Array.from([.1,.5,.1,.7]),province:Float64Array.from([0,1,0,2])};
 const groups=boundaryGeometry(map,2,{contours:true,borders:true});
 assert.ok(groups.some(g=>g.color==='#62583730'&&g.segments.some(s=>s.some(v=>v%1!==0))));
 assert.deepEqual(groups.filter(g=>['#4d6559dd','#66492fe8'].includes(g.color)),[{color:'#4d6559dd',width:1.25,segments:[[1,0,1,1],[1,1,1,2]]},{color:'#66492fe8',width:1.25,segments:[[1,1,2,1]]}]);
 assert.deepEqual(boundaryGeometry(map,2),[{color:'#4d6559dd',width:.55,segments:[[1,0,1,1],[1,1,1,2]]}]);
});
test('camera and dynamic snapshots reuse boundaries; static replacements invalidate them',()=>{
 const map={height:Float64Array.from([.1,.5,.1,.7]),province:new Float64Array(4)};
 const a=boundaryPaths(map,2,{},Path);
 assert.equal(boundaryPaths({...map,air:new Float64Array(4)},2,{},Path),a);
 assert.notEqual(boundaryPaths(map,2,{contours:true},Path),a);
 assert.notEqual(boundaryPaths({...map,province:new Float64Array(4)},2,{},Path),a);
 assert.notEqual(boundaryPaths({...map,height:map.height.slice()},2,{},Path),a);
});
