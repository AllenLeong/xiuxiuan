import test from 'node:test';import assert from 'node:assert/strict';
import {stableChannels} from '../verification/stable-channels.js';
const result=stableChannels();
for(const [name,passed]of Object.entries(result.checks))test(`stable transport: ${name}`,()=>assert.ok(passed,JSON.stringify({lateRelativeChange:result.lateRelativeChange,branches:result.branches.map(({mode,direct,detour,uptake})=>({mode,direct,detour,uptake}))})));
