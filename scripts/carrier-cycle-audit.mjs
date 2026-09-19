import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {carrierCycle} from '../verification/carrier-cycle.js';
const sourceFiles=['src/world.js','src/qi-transport.js','src/ancient-influence.js','src/regions.js','src/region-geometry.js','src/species.js','verification/carrier-cycle.js','verification/step-audit.js','tests/carrier-cycle.test.mjs'];
const sources=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])));
const baseline=carrierCycle(),combinations=[];
for(const bindRate of [0,.08])for(const releaseRate of [0,.04])for(const passage of [0,.4]){
 const {checkpoints,...result}=carrierCycle({bindRate,releaseRate,passage});combinations.push(result);
}
const report={recordedAt:new Date().toISOString(),sources,scope:'R20: zero external acquired-qi input, 100 years, 16² controlled fixture; eight retention/connection combinations. Mineral binding is an irreversible sink in this version, not a fabricated return loop.',baseline,combinations};
await writeFile('evidence/carrier-cycle.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({initial:baseline.initial,final:baseline.final,externalInput:baseline.externalInput,violations:baseline.violations,maxRelativeError:baseline.maxRelativeError,sums:baseline.sums,combinations:combinations.length}));
