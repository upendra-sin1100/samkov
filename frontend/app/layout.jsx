import './globals.css';
import './learning-atmosphere.css';
import './hero.css';
import './program-documents.css';
import AccountProvider from './auth-provider';
export const metadata = {
    title: 'SamkovAI — Learn. Create. Progress.',
    description: 'Free project-based virtual internships. Build real projects and earn verified proof of your work.',
    icons: {
        icon: [
            { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
            { url: '/favicon-48.png', type: 'image/png', sizes: '48x48' },
        ],
        apple: '/apple-touch-icon.png',
    },
};
const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SamkovAI',
    url: 'https://samkovai.me',
    logo: 'https://samkovai.me/logo.png',
};
export default function RootLayout({ children }) { return <html lang="en" data-theme="light" suppressHydrationWarning><head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}/><script dangerouslySetInnerHTML={{ __html: `try{const theme=localStorage.getItem('samkov-theme');document.documentElement.dataset.theme=theme==='dark'?'dark':'light'}catch{}` }}/></head><body><AccountProvider>{children}</AccountProvider></body></html>; }
