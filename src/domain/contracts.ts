export type Role='administrator'|'registrar'|'teacher';
export type ApiResult<T>={ok:true;data:T}|{ok:false;code:string;message:string};
export type GradeScores={monthly:number|null;firstPrelim:number|null;secondPrelim:number|null;midterm:number|null;preFinal:number|null;final:number|null};
export type GradeResult={status:'incomplete'|'complete';generalAverage:string|null;classificationAverage:string|null;numericalEquivalent:string|null;remarks:'Passed'|'Failed'|null};
export type MutationRequest<T>={actionId:string;expectedVersion:number|null;payload:T};
export type PageResult<T>={items:T[];total:number;page:number;pageSize:number};
export type Access={state:'pending'|'active'|'rejected'|'revoked'|'unverified';role:Role|null;profile:{id:string;display_name:string;username:string;position:string}};
