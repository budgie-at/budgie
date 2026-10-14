import { Trans } from '@lingui/react/macro';

import { FaqPageJsonLd } from '../../../generic/component/faq-page-json-ld/faq-page-json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeatureFaqItem } from '../feature-faq-item/feature-faq-item';
import { FeatureSplitSection } from '../feature-split-section/feature-split-section';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
}

const FeatureFaqRoot = ({ children, locale }: Props) => (
    <>
        <FaqPageJsonLd i18n={getI18nInstance(locale)} itemType={FeatureFaqItem}>
            {children}
        </FaqPageJsonLd>
        <FeatureSplitSection className="feature-plain" heading={<Trans>Questions</Trans>} id="faq">
            {children}
        </FeatureSplitSection>
    </>
);

export const FeatureFaq = Object.assign(FeatureFaqRoot, {
    Item: FeatureFaqItem
});
