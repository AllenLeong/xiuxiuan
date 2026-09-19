import test from 'node:test';import assert from 'node:assert/strict';
import {MapView} from '../src/map.js';
test('coalesced snapshots build and paint the same latest state, with no stale resume frame',()=>{
 const map=Object.create(MapView.prototype),calls=[];
 Object.assign(map,{rendering:true,textureDirty:false,dirty:false,frames:[],canvas:{style:{}},state:{seed:'same',size:16,map:{}},fit(){},build(){calls.push(['build',this.state.year]);this.textureDirty=false;},draw(){calls.push(['draw',this.state.year]);this.dirty=false;}});
 map.update({seed:'same',size:16,year:1,map:{}});map.update({seed:'same',size:16,year:2,map:{}});
 assert.deepEqual(calls,[]);map.renderFrame(1);assert.deepEqual(calls,[['build',2],['draw',2]]);
 map.renderFrame(2);assert.equal(calls.length,2);
 map.setRendering(false);map.update({seed:'same',size:16,year:3,map:{}});map.renderFrame(3);assert.equal(calls.length,2);
 map.setRendering(true);map.renderFrame(4);assert.deepEqual(calls.slice(2),[['build',3],['draw',3]]);assert.equal(map.canvas.style.visibility,'');
 map.setLayer('ground');map.renderFrame(5);assert.deepEqual(calls.slice(4),[['build',3],['draw',3]]);
});
