/* oxlint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Children, isValidElement } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BASE_URL } from '../../constant/seo.constant';
import { BreadcrumbsJsonLdItem, type BreadcrumbsJsonLdItemProps } from '../breadcrumbs-json-ld-item/breadcrumbs-json-ld-item';
import { JsonLd } from '../json-ld/json-ld';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
    readonly path: string;
}

const BreadcrumbsJsonLdRoot = ({ children, locale, path }: Props) => {
    const url = `${BASE_URL}/${locale}${path}`;
    const itemListElement = Children.toArray(children)
        .map(child => {
            if (!isValidElement<BreadcrumbsJsonLdItemProps>(child)) {
                return null;
            }

            if (child.type !== BreadcrumbsJsonLdItem) {
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

export const BreadcrumbsJsonLd = Object.assign(BreadcrumbsJsonLdRoot, {
    Item: BreadcrumbsJsonLdItem
});
