import { Trans } from '@lingui/react/macro';

import { FaqPageJsonLd } from '../../../generic/component/faq-page-json-ld/faq-page-json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeaturePageFaqItem } from '../feature-page-faq-item/feature-page-faq-item';
import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
}

export const FeaturePageFaqSection = ({ children, locale }: Props) => (
    <FeaturePageSection id="faq">
        <FaqPageJsonLd i18n={getI18nInstance(locale)} itemType={FeaturePageFaqItem}>
            {children}
        </FaqPageJsonLd>
        <FeaturePageHeading>
            <Trans>Frequently Asked Questions</Trans>
        </FeaturePageHeading>
        <div className="space-y-4">{children}</div>
    </FeaturePageSection>
);
