import test from 'node:test';
import assert from 'node:assert/strict';
import {traitMatrix} from '../verification/trait-matrix.js';
for(const row of traitMatrix())test(`R11 independent ${row.trait} coefficient affects its ecological process`,()=>assert.ok(row.pass,JSON.stringify(row)));
