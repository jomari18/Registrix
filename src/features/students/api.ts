import {rpc} from '../../lib/api';
import type {PageResult} from '../../domain/contracts';
import type {Student} from '../../domain/records';
export const studentsApi={list:(request:unknown)=>rpc<PageResult<Student>>('list_students',request),get:(id:string)=>rpc<Student>('get_student',{id})};
