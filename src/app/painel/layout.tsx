import {requireUser} from '@/lib/auth';import {Shell} from '@/components/shell';
export const dynamic='force-dynamic';
export default async function Layout({children}:{children:React.ReactNode}){const {profile}=await requireUser();return <Shell name={profile.full_name}>{children}</Shell>;}
