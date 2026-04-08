import type { MetadataRoute } from 'next';

const robots = (): MetadataRoute.Robots => ({
    rules: [
        {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/']
        }
    ],
    sitemap: 'https://budgie.app/sitemap.xml'
});

export default robots;
