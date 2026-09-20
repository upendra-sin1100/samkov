import './globals.css';
import AccountProvider from './auth-provider';
export const metadata = { title: 'SamkovAI — Learn. Build. Prove your skills.', description: 'Free project-based virtual internships. Build real projects and earn verified proof of your work.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `try{const theme=localStorage.getItem('samkov-theme');document.documentElement.dataset.theme=theme==='dark'||(!theme&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch{}` }}/></head><body><AccountProvider>{children}</AccountProvider></body></html>; }
