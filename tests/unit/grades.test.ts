import {describe,it,expect} from 'vitest';
import {parseScore,computeGrade} from '../../src/domain/grades';
const scores=(n:number|null)=>({monthly:n,firstPrelim:n,secondPrelim:n,midterm:n,preFinal:n,final:n});
describe('six-period general average',()=>{
 it('computes mixed scores with equal weights',()=>expect(computeGrade({monthly:88,firstPrelim:90,secondPrelim:91,midterm:89,preFinal:92,final:90})).toEqual({status:'complete',generalAverage:'90.00',classificationAverage:'90.0',numericalEquivalent:'1.75',remarks:'Passed'}));
 it.each([[96.45,'96.45','96.5','1.00'],[74.44,'74.44','74.4','5.00'],[74.45,'74.45','74.5','3.00'],[0,'0.00','0.0','5.00'],[100,'100.00','100.0','1.00']])('rounds %s directly from raw average',(n,a,c,e)=>expect(computeGrade(scores(n as number))).toMatchObject({generalAverage:a,classificationAverage:c,numericalEquivalent:e,remarks:e==='5.00'?'Failed':'Passed'}));
 it('retains null as incomplete and explicit zero as a score',()=>{expect(parseScore('')).toBeNull();expect(parseScore('0')).toBe(0);expect(computeGrade({...scores(90),final:null})).toEqual({status:'incomplete',generalAverage:null,classificationAverage:null,numericalEquivalent:null,remarks:null});});
 for(const [boundary,equivalent,below] of [[96.5,'1.00','1.25'],[93.5,'1.25','1.50'],[90.5,'1.50','1.75'],[87.5,'1.75','2.00'],[84.5,'2.00','2.25'],[81.5,'2.25','2.50'],[78.5,'2.50','2.75'],[75.5,'2.75','3.00'],[74.5,'3.00','5.00']] as const){
 it(`classifies below / at / above ${boundary}`,()=>{expect(computeGrade(scores(boundary-.06)).numericalEquivalent).toBe(below);expect(computeGrade(scores(boundary-.05)).numericalEquivalent).toBe(equivalent);expect(computeGrade(scores(boundary+.05)).numericalEquivalent).toBe(equivalent);});}
 it('rounds a mixed-score tie once',()=>expect(computeGrade({...scores(74.44),final:74.5}).numericalEquivalent).toBe('3.00'));
 it.each(['-0.01','100.01','NaN','Infinity','90.001','hello','1e2','0x10'])('rejects invalid input %s',n=>expect(()=>parseScore(n)).toThrow());
 it.each([-0.01,100.01,NaN,Infinity,90.001])('rejects invalid numeric score %s',n=>expect(()=>computeGrade(scores(n))).toThrow());
});
