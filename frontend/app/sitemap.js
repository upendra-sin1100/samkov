import { tracks } from './data';

export default function sitemap() {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://samkovai.me').origin;
    const paths = ['/', '/internships', '/tasks', '/verify', '/privacy', '/contact',
        ...tracks.map(track => `/internships/${track.slug}`)];
    return paths.map(path => ({ url: origin + (path === '/' ? '' : path) }));
}
