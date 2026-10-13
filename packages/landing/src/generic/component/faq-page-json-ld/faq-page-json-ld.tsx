/* oxlint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Children, type ElementType, type ReactNode, isValidElement } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { extractTransMessage } from '../../../i18n/utils/extract-trans-message.util';
import { JsonLd } from '../json-ld/json-ld';

import type { I18n } from '@lingui/core';

interface FaqItemProps {
    readonly question: ReactNode;
    readonly answer?: ReactNode;
    readonly children?: ReactNode;
}

interface Props {
    readonly children: ReactNode;
    readonly i18n: I18n;
    readonly itemType: ElementType;
}

export const FaqPageJsonLd = ({ children, i18n, itemType }: Props) => {
    const items = Children.toArray(children)
        .filter(child => isValidElement<FaqItemProps>(child))
        .filter(child => child.type === itemType)
        .map(child => ({
            '@type': 'Question',
            name: extractTransMessage(child.props.question, i18n),
            acceptedAnswer: {
                '@type': 'Answer',
                text: extractTransMessage(child.props.answer ?? child.props.children, i18n)
            }
        }));

    const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items };

    return isNotEmptyArray(items) && <JsonLd data={faqSchema} />;
};
