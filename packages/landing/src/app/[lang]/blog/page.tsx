import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BlogBrowser } from '../../../blog/component/blog-browser/blog-browser';
import { ARTICLE_REGISTRY } from '../../../blog/constant/article-registry.constant';
import { resolveArticleShot } from '../../../blog/utils/resolve-article-shot.util';
import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { Motion } from '../../../generic/component/motion/motion';
import { buildPageMetadata } from '../../../generic/utils/build-page-metadata.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildPageMetadata({
        description: i18n._(
            msg`Articles about financial privacy, security best practices, offline-first architecture, and tips for better expense tracking.`
        ),
        locale: lang,
        path: '/blog',
        title: i18n._(msg`Financial Privacy Blog & Insights`)
    });
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
        readingTimeMinutes: entry.readingTimeMinutes,
        shot: resolveArticleShot(entry.slug, entry.relatedFeatureSlugs, lang)
    })).sort((article1, article2) => new Date(article2.date).getTime() - new Date(article1.date).getTime());

    return (
        <main className="flex-1">
            <BreadcrumbsJsonLd locale={lang} path="/blog">
                <BreadcrumbsJsonLd.Item name={i18n._(msg`Home`)} path={`/${lang}`} />
                <BreadcrumbsJsonLd.Item name={i18n._(msg`Blog`)} path={`/${lang}/blog`} />
            </BreadcrumbsJsonLd>
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

                    <BlogBrowser articles={allArticles} locale={lang} />
                </div>
            </section>
        </main>
    );
}
