import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { buildPillarHubJsonLd } from '../../util/build-pillar-hub-json-ld.util';

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
    const [breadcrumbSchema, webPageSchema] = buildPillarHubJsonLd({
        locale,
        slug,
        title,
        description,
        homeLabel,
        publishedAt,
        updatedAt
    });

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {children}
        </main>
    );
};
