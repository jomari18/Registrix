export const courses=['BSCS','BSTM','BSHM','BSBA','AB POLSCI','BEED','BSED MATH','BSED ENG'];
export function normalizeStudentNumber(s:string){return s.trim().toUpperCase();}
export function validateStudent(v:{student_no:string;surname:string;first_name:string;middle_initial:string;gender:string}):string|null{
 if(!normalizeStudentNumber(v.student_no)||v.student_no.trim().length>40)return 'Enter a student number up to 40 characters.';
 if(!v.surname.trim()||!v.first_name.trim()||v.surname.trim().length>100||v.first_name.trim().length>100)return 'Enter a surname and first name, each up to 100 characters.';
 if(v.middle_initial.length>12)return 'Middle initial must be at most 12 characters.';
 if(!['male','female','other'].includes(v.gender))return 'Select a gender.';return null;
}
type Academic={course:string;year_level:number;semester:string};
function validateAcademic(v:Academic){if(!courses.includes(v.course)||!Number.isInteger(v.year_level)||v.year_level<1||v.year_level>4||!['1st','2nd','summer'].includes(v.semester))return 'Select a valid course, year level and semester.';return null;}
export function validateClass(v:Academic&{section:string;school_year:string;subject_id:string}):string|null{const academic=validateAcademic(v);if(academic)return academic;if(!/^[A-J]$/.test(v.section))return 'Select a section from A to J.';const year=v.school_year.match(/^(\d{4})-(\d{4})$/);if(!year||+year[2]!==+year[1]+1||+year[1]<2000||+year[1]>2199)return 'Use consecutive school years, for example 2026-2027.';if(!v.subject_id)return 'Select a subject matching this academic group.';return null;}
export function validateSubject(v:Academic&{code:string;description:string;units:number}):string|null{const academic=validateAcademic(v);if(academic)return academic;if(!v.code.trim()||v.code.length>80||!v.description.trim()||v.description.length>300)return 'Enter a subject code (up to 80 characters) and description (up to 300).';if(!Number.isFinite(v.units)||v.units<=0||v.units>30||Math.abs(v.units*10-Math.round(v.units*10))>1e-8)return 'Units must be more than zero and at most 30, with up to one decimal.';return null;}
