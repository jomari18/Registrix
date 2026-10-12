export function privateStateMustClear(a:string|null,b:string|null){return a!==b;}
export function canEnterWorkspace(state:string,role:string|null,verified:boolean){return verified&&state==='active'&&['administrator','registrar','teacher'].includes(role??'');}
export function validateRegistration(v:{name:string;username:string;position:string;email:string;password:string;confirm:string}):string|null{
 if(!v.name.trim()||v.name.trim().length>120)return 'Enter your full name (up to 120 characters).';
 if(!/^[a-z0-9_]{3,32}$/.test(v.username.trim().toLowerCase()))return 'Username must be 3–32 letters, numbers or underscores.';
 if(v.position.trim().length>80)return 'Position must be at most 80 characters.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))return 'Enter a valid email address.';
 if(v.password.length<8||v.password.length>128)return 'Use a password with 8–128 characters.';
 if(v.password!==v.confirm)return 'Passwords do not match.';return null;
}
