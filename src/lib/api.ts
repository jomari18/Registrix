import {client} from './client';
import type {ApiResult} from '../domain/contracts';
export class ApiError extends Error{constructor(public code:string,message:string){super(message);}}
export async function rpc<T>(name:string,request:unknown={}):Promise<T>{
 if(!client)throw new ApiError('CONFIGURATION','Configure the dedicated Registrix project.');
 const {data,error}=await client.rpc(name,name==='get_my_access'?{}:{p_request:request});
 if(error)throw new ApiError('NETWORK',navigator.onLine?'Could not confirm the server response. Check the connection and try again.':'You are offline. Reconnect before saving.');
 const result=data as ApiResult<T>;
 if(!result||typeof result.ok!=='boolean')throw new ApiError('NETWORK','The response could not be verified.');
 if(!result.ok){if(result.code==='FORBIDDEN')window.dispatchEvent(new Event('registrix-access-refresh'));throw new ApiError(result.code,result.message);}
 return result.data;
}
export function errorMessage(error:unknown){return error instanceof Error?error.message:'This request could not be completed.';}
