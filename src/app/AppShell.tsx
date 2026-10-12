import {NavLink,Link,Outlet} from 'react-router-dom';
import {useState} from 'react';
import type {Access} from '../domain/contracts';
import {Icon,type IconName} from '../components/Icon';
import {ConfirmationDialog} from '../components/ConfirmationDialog';
export function Brand(){return <Link className="brand" to="/"><img src="/assets/logo/registrix-mark.svg" alt=""/>Registrix</Link>;}
export function AppShell({access,onSignOut}:{access:Access;onSignOut:()=>Promise<void>}){
 const [logout,setLogout]=useState(false),[busy,setBusy]=useState(false);
 const links:[string,string,IconName][]=[['/','Overview','dashboard'],['/students','Students','students'],['/classes','Classes','book'],['/grades','Grading sheets','grades'],['/help','Help','help']];
 if(access.role==='administrator')links.splice(4,0,['/accounts','Staff access','users']);
 return <><a href="#main" className="skip-link">Skip to content</a><header className="shell-header"><div className="header-inner"><Brand/><nav className="top-nav" aria-label="Main navigation">{links.map(([to,label])=><NavLink key={to} end={to==='/'} to={to}>{label}</NavLink>)}</nav><div className="user-menu"><span className="avatar">{access.profile.display_name.split(/\s+/).slice(0,2).map(n=>n[0]).join('')}</span><div className="user-name">{access.profile.display_name}<small className="muted">{access.role}</small></div><button className="btn quiet small" aria-label="Sign out" onClick={()=>setLogout(true)}><Icon name="logout"/></button></div></div></header><main id="main" className="main" tabIndex={-1}><Outlet/></main><footer className="footer"><span>Registrix · Student records, thoughtfully organized.</span><span>Independent academic portfolio project · <Link to="/about">About Registrix</Link></span></footer><nav className="bottom-nav" aria-label="Mobile navigation">{links.map(([to,label,icon])=><NavLink key={to} end={to==='/'} to={to}><Icon name={icon}/><span>{label==='Grading sheets'?'Grades':label==='Staff access'?'Staff':label}</span></NavLink>)}</nav><ConfirmationDialog open={logout} title="Sign out of Registrix?" message="Save your work before signing out. Private drafts and unresolved action references are cleared on this device." confirmLabel="Sign out" busy={busy} onCancel={()=>setLogout(false)} onConfirm={async()=>{setBusy(true);try{await onSignOut();}finally{setBusy(false);setLogout(false);}}}/></>;
}
