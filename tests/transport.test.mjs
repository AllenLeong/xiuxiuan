import test from 'node:test';import assert from 'node:assert/strict';import{transportExperiments}from'../verification/transport-experiments.js';
const result=transportExperiments();
for(const [name,passed] of Object.entries(result.checks))test(`transport mechanism: ${name}`,()=>assert.ok(passed,JSON.stringify(result)));
