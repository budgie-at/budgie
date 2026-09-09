import path from 'node:path';

import { writeManifest } from './social-posts/manifest.mjs';
import { monthOnePosts } from './social-posts/posts/month-01.mjs';
import { DEFAULT_SCREENS_DIR, SIZES, SOCIAL_ROOT, assertChrome, renderSlides, sizeLabel } from './social-posts/render-slide.mjs';
import { MISSING_SCREENS } from './social-posts/slide-components.mjs';

const args = new Map(
    process.argv.slice(2).map(argument => {
        const [key, value = 'true'] = argument.replace(/^--/, '').split('=');

        return [key, value];
    })
);

const only = args.get('post');
const verified = args.get('verified') === 'true';
const theme = args.get('theme') === 'light' ? 'light' : 'dark';
const themeSuffix = theme === 'light' ? '-light' : '';
const screensDir = path.resolve(args.get('screens') ?? DEFAULT_SCREENS_DIR);
const posts = monthOnePosts().filter(post => only === undefined || post.post === only);

if (posts.length === 0) {
    console.error(`No post matches --post=${only}`);
    process.exit(1);
}

assertChrome();

const jobs = [];

for (const post of posts) {
    const folder = path.join(SOCIAL_ROOT, `${post.post}-${post.slug}`, verified ? 'final' : 'draft');

    post.slides.forEach((slide, index) => {
        const slideNumber = String(index + 1).padStart(2, '0');

        for (const sizeName of slide.sizes) {
            const size = SIZES[sizeName];
            const file = path.join(folder, `${post.post}-${post.slug}-slide-${slideNumber}-${sizeLabel(size)}${themeSuffix}.png`);

            jobs.push({
                body: slide.render({
                    sizeName,
                    size,
                    theme,
                    verified,
                    screensDir,
                    carousel: post.carousel === true,
                    slideIndex: index + 1,
                    slideCount: post.slides.length
                }),
                file,
                size,
                theme,
                asset: {
                    post: post.post,
                    slug: post.slug,
                    slide: index + 1,
                    file: path.relative(SOCIAL_ROOT, file),
                    size: { width: size.width, height: size.height },
                    alt: slide.alt,
                    screens: slide.screens,
                    verified
                }
            });
        }
    });
}

await renderSlides(jobs, job => console.log(`wrote ${job.asset.file}`));

const total = writeManifest({
    file: path.join(SOCIAL_ROOT, 'manifest.json'),
    assets: jobs.map(job => job.asset),
    theme,
    renderedPosts: new Set(posts.map(post => post.post))
});

console.log(`wrote manifest.json (${jobs.length} rendered, ${total} tracked)`);

if (MISSING_SCREENS.size > 0) {
    console.warn(`\nMissing screen captures under ${screensDir} (theme folder first, then flat):`);
    for (const name of [...MISSING_SCREENS].sort()) {
        console.warn(`  - ${name}`);
    }
    console.warn('Placeholder device screens were rendered instead.');
}
