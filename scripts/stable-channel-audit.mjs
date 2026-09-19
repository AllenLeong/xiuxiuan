import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stableChannels} from '../verification/stable-channels.js';
const files=['src/world.js','src/species.js','verification/stable-channels.js','verification/step-audit.js','tests/stable-channels.test.mjs'];
const sources=Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const result=stableChannels();
await writeFile('evidence/stable-channels.json',JSON.stringify({recordedAt:new Date().toISOString(),sources,...result},null,2)+'\n');
console.log(JSON.stringify({earlyRelativeChange:result.earlyRelativeChange,lateRelativeChange:result.lateRelativeChange,checks:result.checks,checkpoints:result.checkpoints.map(({year,sourceGround,sourceAir,uptake,direct,detour})=>({year,sourceGround,sourceAir,uptake,direct,detour})),branches:result.branches.map(({mode,uptake,direct,detour,violations})=>({mode,uptake,direct,detour,violations}))}));
