export default function robots() {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://samkovai.me').origin;
    return {
        rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/dashboard', '/profile', '/learn', '/submit', '/offer', '/certificate', '/apply', '/login', '/signup'] },
        sitemap: `${origin}/sitemap.xml`,
    };
}
