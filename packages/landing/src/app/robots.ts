import { BASE_URL } from '../generic/constant/seo.constant';

import type { MetadataRoute } from 'next';

const robots = (): MetadataRoute.Robots => ({
    rules: [
        {
            userAgent: '*',
            allow: '/'
        }
    ],
    sitemap: `${BASE_URL}/sitemap.xml`
});

export default robots;
