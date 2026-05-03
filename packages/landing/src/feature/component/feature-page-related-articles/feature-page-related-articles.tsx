'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { isDefined } from '@rnw-community/shared';
import Link from 'next/link';

import { ARTICLE_REGISTRY } from '../../../blog/constant/article-registry.constant';
import { Motion } from '../../../generic/component/motion/motion';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

interface Props {
    readonly locale: string;
    readonly slugs: readonly string[];
}

export const FeaturePageRelatedArticles = ({ locale, slugs }: Props) => {
    const { i18n } = useLingui();
    const articles = slugs
        .map(slug => ARTICLE_REGISTRY.find(entry => entry.slug === slug))
        .filter(isDefined);

    if (articles.length === 0) {
        return null;
    }

    return (
        <FeaturePageSection>
            <FeaturePageHeading>
                <Trans>Read More on the Blog</Trans>
            </FeaturePageHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {articles.map((article, index) => (
                    <Motion index={index} key={article.slug}>
                        <Link
                            className="block rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-emerald-500/60 hover:bg-card/80"
                            href={`/${locale}/blog/${article.slug}`}
                        >
                            <h3 className="font-semibold">{i18n._(article.title)}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{i18n._(article.description)}</p>
                        </Link>
                    </Motion>
                ))}
            </div>
        </FeaturePageSection>
    );
};
