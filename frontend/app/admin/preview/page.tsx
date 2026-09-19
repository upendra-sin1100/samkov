'use client';

import {useRouter} from 'next/navigation';
import AdminDashboard from '../../admin-dashboard';
import {tracks,projectNames} from '../../data';

export default function AdminPreview(){
 const router=useRouter();
 return <AdminDashboard preview records={{applications:[],submissions:[]}} tracks={tracks} names={projectNames} api={async()=>{throw new Error('This preview does not change live records.')}} refresh={async()=>{}} go={path=>router.push(path)}/>;
}
