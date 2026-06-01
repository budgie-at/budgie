import { PillarHubBreadcrumbsJsonLd } from '../pillar-hub-breadcrumbs-json-ld/pillar-hub-breadcrumbs-json-ld';
import { PillarHubWebPageJsonLd } from '../pillar-hub-web-page-json-ld/pillar-hub-web-page-json-ld';

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
            <PillarHubBreadcrumbsJsonLd locale={locale} slug={slug}>
                <PillarHubBreadcrumbsJsonLd.Item name={homeLabel} path={homePath} />
                <PillarHubBreadcrumbsJsonLd.Item name={title} path={hubPath} />
            </PillarHubBreadcrumbsJsonLd>
            <PillarHubWebPageJsonLd
                description={description}
                locale={locale}
                publishedAt={publishedAt}
                slug={slug}
                title={title}
                updatedAt={updatedAt}
            />
            {children}
        </main>
    );
};
