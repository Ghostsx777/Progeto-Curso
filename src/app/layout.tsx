import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:{default:'DevPath Academy',template:'%s · DevPath Academy'},description:'Formação independente em desenvolvimento Full Stack. Aprenda, construa e evolua.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="pt"><body>{children}</body></html>;}
