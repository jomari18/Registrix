import {rpc} from '../../lib/api';
import type {Enrollment} from '../../domain/records';
export const gradesApi={get:(id:string)=>rpc<Enrollment>('get_grade',{id})};
