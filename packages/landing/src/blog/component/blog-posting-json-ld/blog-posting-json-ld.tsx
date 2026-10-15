/* oxlint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL } from '../../../generic/constant/seo.constant';
import { getI18nInstance } from '../../../i18n/app-router-i18n';

interface Props {
    title: string;
    description: string;
    date: string;
    dateModified?: string;
    image?: string;
    locale: string;
    slug: string;
    keywords: string;
}

export const BlogPostingJsonLd = ({ title, description, date, dateModified, image, locale, slug, keywords }: Props) => {
    const articleUrl = `${BASE_URL}/${locale}/blog/${slug}`;
    const organization = {
        '@type': 'Organization',
        name: 'Budgie',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo/black-on-white.svg` }
    };
    const data = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        datePublished: date,
        dateModified: dateModified ?? date,
        author: organization,
        publisher: organization,
        url: articleUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
        ...(isDefined(image) && { image: `${BASE_URL}${image}` }),
        keywords
    };

    const i18n = getI18nInstance(locale);

    return (
        <>
            <JsonLd data={data} />
            <BreadcrumbsJsonLd locale={locale} path={`/blog/${slug}`}>
                <BreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={`/${locale}`} />
                <BreadcrumbsJsonLd.Item name={t(i18n)`Blog`} path={`/${locale}/blog`} />
                <BreadcrumbsJsonLd.Item name={title} path={`/${locale}/blog/${slug}`} />
            </BreadcrumbsJsonLd>
        </>
    );
};
/* oxlint-enable lingui/no-unlocalized-strings */
