/* oxlint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Children, isValidElement } from 'react';

import { isDefined } from '@rnw-community/shared';

import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { extractTransMessage } from '../../../i18n/util/extract-trans-message.util';
import { BASE_URL } from '../../constant/seo.constant';
import { CapabilityBentoAnchor } from '../capability-bento-anchor/capability-bento-anchor';
import { CapabilityBentoBand } from '../capability-bento-band/capability-bento-band';
import { CapabilityBentoCell } from '../capability-bento-cell/capability-bento-cell';
import { JsonLd } from '../json-ld/json-ld';

import type { CapabilityBentoLinkPropsInterface } from '../../interface/capability-bento-link-props.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly heading: ReactNode;
    readonly lede: ReactNode;
    readonly children: ReactNode;
}

const CapabilityBentoRoot = ({ locale, heading, lede, children }: Props) => {
    const i18n = getI18nInstance(locale);
    const itemListElement = Children.toArray(children)
        .map(child => (isValidElement<CapabilityBentoLinkPropsInterface>(child) ? child.props : null))
        .filter(isDefined)
        .map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: extractTransMessage(item.title, i18n),
            url: `${BASE_URL}${item.href}`
        }));
    const itemList = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement };

    return (
        <section className="w-full py-8 md:py-20" id="features">
            <JsonLd data={itemList} />

            <div className="container px-4 md:px-6 max-w-7xl">
                <div className="max-w-2xl">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-balance">{heading}</h2>
                    <p className="mt-3 text-base md:text-lg text-muted-foreground text-pretty">{lede}</p>
                </div>

                <div className="bento-grid mt-8 md:mt-12">{children}</div>
            </div>
        </section>
    );
};

export const CapabilityBento = Object.assign(CapabilityBentoRoot, {
    Anchor: CapabilityBentoAnchor,
    Band: CapabilityBentoBand,
    Cell: CapabilityBentoCell
});
