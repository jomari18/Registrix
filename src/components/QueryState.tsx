import {Button} from './Button';
import {StatusNotice} from './StatusNotice';
import {Icon,type IconName} from './Icon';
export function QueryState({query}:{query:{loading:boolean;error:string;refresh:()=>void}}){if(query.loading)return <div className="loading" role="status">Loading your workspace records…</div>;if(query.error)return <StatusNotice type="error"><p>{query.error}</p><Button variant="secondary" onClick={query.refresh}>Try again</Button></StatusNotice>;return null;}
export function EmptyState({title,description,icon='students'}:{title:string;description:string;icon?:IconName}){return <div className="empty"><div className="icon-circle"><Icon name={icon}/></div><h3>{title}</h3><p>{description}</p></div>;}
