import { Trans } from '@lingui/react/macro';

import { FeaturePageHeading } from '../feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../feature-page-section/feature-page-section';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeaturePageFaqSection = ({ children }: Props) => (
    <FeaturePageSection id="faq">
        <FeaturePageHeading>
            <Trans>Frequently Asked Questions</Trans>
        </FeaturePageHeading>
        <div className="space-y-4">{children}</div>
    </FeaturePageSection>
);
