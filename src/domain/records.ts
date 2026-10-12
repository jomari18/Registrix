import type {GradeScores,GradeResult} from './contracts';
export type Student={id:string;student_no:string;surname:string;first_name:string;middle_initial:string;gender:string;archived:boolean;version:number;enrollments?:Enrollment[]};
export type Subject={id:string;code:string;description:string;units:number;course:string;year_level:number;semester:string;active:boolean;version:number};
export type AcademicClass={id:string;subject_id:string;course:string;year_level:number;section:string;semester:string;school_year:string;archived:boolean;version:number;subject:Subject;assignments?:Assignment[]};
export type Grade={enrollment_id:string;scores:GradeScores;result:GradeResult;version:number};
export type Enrollment={id:string;student_id:string;class_id:string;archived:boolean;version:number;student:Student;class:AcademicClass;grade:Grade|null};
export type Assignment={user_id:string;class_id:string;active:boolean;version:number;profile:{display_name:string}};
export type Staff={id:string;display_name:string;username:string;email:string;email_confirmed_at:string|null;role:string|null;state:string;version:number};
export function studentName(s:Student){return `${s.surname}, ${s.first_name}${s.middle_initial?' '+s.middle_initial:''}`;}
export function classLabel(c:AcademicClass){return `${c.subject.code} · ${c.course} ${c.year_level}-${c.section} · ${c.semester} · ${c.school_year}`;}
