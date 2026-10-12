import assert from 'node:assert/strict';
import {pool} from '../../tools/db-test-lib.mjs';
import {computeGrade,periods} from '../../src/domain/grades.ts';
export async function runVectors(){for(const n of [null,0,100,74.44,74.45,96.45,...[74.5,75.5,78.5,81.5,84.5,87.5,90.5,93.5,96.5].flatMap(n=>[n-.06,n-.05,n,n+.05])]){const s=Object.fromEntries(periods.map(p=>[p,n===null?null:Math.round(n*100)/100]));const db=(await pool.query('select registrix_private.calculate_grade($1::jsonb) result',[JSON.stringify(s)])).rows[0].result;assert.deepEqual(db,computeGrade(s));}}
