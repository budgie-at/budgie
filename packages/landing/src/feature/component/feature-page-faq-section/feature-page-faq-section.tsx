/* eslint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Trans } from '@lingui/react/macro';
import { Children, isValidElement } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { extractTransMessage } from '../../../i18n/util/extract-trans-message.util';
import { FeaturePageFaqItem } from '../feature-page-faq-item/feature-page-faq-item';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
}

export const FeaturePageFaqSection = ({ children, locale }: Props) => {
    const i18n = getI18nInstance(locale);
    const items = Children.toArray(children)
        .filter(child => isValidElement<{ readonly question: ReactNode; readonly answer: ReactNode }>(child))
        .filter(child => child.type === FeaturePageFaqItem)
        .map(child => ({
            '@type': 'Question',
            name: extractTransMessage(child.props.question, i18n),
            acceptedAnswer: {
                '@type': 'Answer',
                text: extractTransMessage(child.props.answer, i18n)
            }
        }));

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items
    };

    return (
        <FeaturePageSection id="faq">
            {isNotEmptyArray(items) && <JsonLd data={faqSchema} />}
            <FeaturePageHeading>
                <Trans>Frequently Asked Questions</Trans>
            </FeaturePageHeading>
            <div className="space-y-4">{children}</div>
        </FeaturePageSection>
    );
};
