import test from 'node:test';import assert from 'node:assert/strict';
import {regionalClasses,regionRings} from '../src/region-geometry.js';
test('regional classification closes a tiny clearing without filling a lake barrier',()=>{const n=16,a=new Uint8Array(n*n).fill(1),land=a.slice();a[85]=0;for(let y=0;y<n;y++){land[y*n+8]=0;a[y*n+8]=0;}const b=regionalClasses(a,land,n);assert.equal(b[85],1);for(let y=0;y<n;y++)assert.equal(b[y*n+8],0);assert.equal(a[85],0);});
test('rings retain inner holes and do not connect diagonal regions',()=>{const cells=[];for(let y=1;y<8;y++)for(let x=1;x<8;x++)if(!(x>=3&&x<=5&&y>=3&&y<=5))cells.push(y*16+x);assert.equal(regionRings(cells,16).length,2);assert.equal(regionRings([0,17],16).length,2);});
