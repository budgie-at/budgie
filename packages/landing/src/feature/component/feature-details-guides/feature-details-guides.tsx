import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { ARTICLE_REGISTRY } from '../../../blog/constant/article-registry.constant';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeatureDetailsItem } from '../feature-details-item/feature-details-item';

interface Props {
    readonly index: number;
    readonly locale: string;
    readonly slugs: readonly string[];
}

export const FeatureDetailsGuides = ({ index, locale, slugs }: Props) => {
    const i18n = getI18nInstance(locale);
    const articles = slugs
        .map(slug => ARTICLE_REGISTRY.find(entry => entry.slug === slug))
        .filter(isDefined)
        .slice(0, 3);

    if (isEmptyArray(articles)) {
        return null;
    }

    return (
        <FeatureDetailsItem index={index} title={<Trans>Guides on the blog</Trans>}>
            <ul className="feature-guides">
                {articles.map(article => (
                    <li key={article.slug}>
                        <Link className="feature-guide-link" href={`/${locale}/blog/${article.slug}`}>
                            {i18n._(article.title)}
                        </Link>
                    </li>
                ))}
            </ul>
        </FeatureDetailsItem>
    );
};
