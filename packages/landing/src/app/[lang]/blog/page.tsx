import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Suspense } from 'react';

import { BlogBrowser } from '../../../blog/component/blog-browser/blog-browser';
import { ARTICLE_REGISTRY } from '../../../blog/constant/article-registry.constant';
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { Motion } from '../../../generic/component/motion/motion';
import { BASE_URL, OG_LOCALE_MAP } from '../../../generic/constant/seo.constant';
import { buildAlternates } from '../../../generic/util/build-alternates.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    const title = i18n._(msg`Financial Privacy Blog & Insights`);
    const description = i18n._(
        msg`Articles about financial privacy, security best practices, offline-first architecture, and tips for better expense tracking.`
    );

    return {
        title,
        description,
        // eslint-disable-next-line lingui/no-unlocalized-strings
        robots: 'index, follow',
        alternates: buildAlternates(lang, '/blog'),
        openGraph: {
            title,
            description,
            type: 'website',
            url: `${BASE_URL}/${lang}/blog`,
            locale: OG_LOCALE_MAP[lang] ?? 'en_US',
            images: [{ url: `${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`, width: 1200, height: 630 }]
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${BASE_URL}/images/design-mode/ai-budgeting-app-4x.jpg`]
        }
    };
}

export default async function BlogPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    initLingui(lang);

    const allArticles = ARTICLE_REGISTRY.map(entry => ({
        slug: entry.slug,
        title: i18n._(entry.title),
        description: i18n._(entry.description),
        date: entry.date,
        author: entry.author,
        tags: entry.tags,
        image: `/${lang}/blog/${entry.slug}/opengraph-image`,
        readingTimeMinutes: entry.readingTimeMinutes
    })).sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime());

    /* eslint-disable lingui/no-unlocalized-strings */
    const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: i18n._(msg`Home`), item: `${BASE_URL}/${lang}` },
            { '@type': 'ListItem', position: 2, name: i18n._(msg`Blog`), item: `${BASE_URL}/${lang}/blog` }
        ]
    };
    /* eslint-enable lingui/no-unlocalized-strings */

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbData} />
            <section className="w-full py-20 md:py-32 overflow-hidden">
                <div className="container px-4 md:px-6">
                    <Motion className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            <Trans>Financial Privacy Blog & Insights</Trans>
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                            <Trans>
                                Stay informed about financial privacy, security best practices, and the latest features in Budgie.
                            </Trans>
                        </p>
                    </Motion>

                    <Suspense fallback={<div className="h-12" />}>
                        <BlogBrowser articles={allArticles} locale={lang} />
                    </Suspense>
                </div>
            </section>
        </main>
    );
}
