import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { WebPageJsonLd } from '../../../generic/component/web-page-json-ld/web-page-json-ld';

import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string;
    readonly homeLabel: string;
    readonly publishedAt: string;
    readonly updatedAt: string;
    readonly children: ReactNode;
}

export const PillarHubPageShell = ({ locale, slug, title, description, homeLabel, publishedAt, updatedAt, children }: Props) => {
    const homePath = `/${locale}`;
    const hubPath = `/${locale}/${slug}`;

    return (
        <main className="flex-1">
            <BreadcrumbsJsonLd locale={locale} path={`/${slug}`}>
                <BreadcrumbsJsonLd.Item name={homeLabel} path={homePath} />
                <BreadcrumbsJsonLd.Item name={title} path={hubPath} />
            </BreadcrumbsJsonLd>
            <WebPageJsonLd
                description={description}
                locale={locale}
                path={`/${slug}`}
                publishedAt={publishedAt}
                title={title}
                updatedAt={updatedAt}
            />
            {children}
        </main>
    );
};
