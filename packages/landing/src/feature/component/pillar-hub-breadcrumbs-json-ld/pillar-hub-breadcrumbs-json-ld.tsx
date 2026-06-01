/* eslint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Children, isValidElement } from 'react';

import { isDefined } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { BASE_URL } from '../../../generic/constant/seo.constant';
import { PillarHubBreadcrumbsJsonLdItem } from '../pillar-hub-breadcrumbs-json-ld-item/pillar-hub-breadcrumbs-json-ld-item';

import type { ComponentProps, ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
    readonly slug: string;
}

const PillarHubBreadcrumbsJsonLdRoot = ({ children, locale, slug }: Props) => {
    const url = `${BASE_URL}/${locale}/${slug}`;
    const itemListElement = Children.toArray(children)
        .map(child => {
            if (!isValidElement<ComponentProps<typeof PillarHubBreadcrumbsJsonLdItem>>(child)) {
                return null;
            }

            if (child.type !== PillarHubBreadcrumbsJsonLdItem) {
                return null;
            }

            return child.props;
        })
        .filter(isDefined)
        .map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${BASE_URL}${item.path}`
        }));

    const data = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement
    };

    return <JsonLd data={data} />;
};

export const PillarHubBreadcrumbsJsonLd = Object.assign(PillarHubBreadcrumbsJsonLdRoot, {
    Item: PillarHubBreadcrumbsJsonLdItem
});
