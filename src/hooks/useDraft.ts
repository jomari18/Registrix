import {useState} from 'react';
import {useAuth} from '../features/auth/AuthProvider';
export function useDraft<T>(scope:string,initial:T){const {user}=useAuth(),key=`registrix:draft:${user!.id}:${scope}`;const [value,setValue]=useState<T>(()=>{try{return JSON.parse(sessionStorage.getItem(key)??'null')??initial;}catch{return initial;}});return {value,set:(next:T)=>{setValue(next);try{sessionStorage.setItem(key,JSON.stringify(next));}catch{/* The save flow independently requires recoverable tab storage. */}},clear:()=>{sessionStorage.removeItem(key);}};}
