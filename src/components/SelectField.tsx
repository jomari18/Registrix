import {useId,type SelectHTMLAttributes,type ReactNode} from 'react';
export function SelectField({label,children,...props}:SelectHTMLAttributes<HTMLSelectElement>&{label:string;children:ReactNode}){const id=useId();return <div className="field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>;}
