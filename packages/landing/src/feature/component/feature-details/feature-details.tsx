import { Trans } from '@lingui/react/macro';

import { FeatureDetailsGuides } from '../feature-details-guides/feature-details-guides';
import { FeatureDetailsItem } from '../feature-details-item/feature-details-item';
import { FeatureSplitSection } from '../feature-split-section/feature-split-section';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FeatureDetailsRoot = ({ children }: Props) => (
    <FeatureSplitSection
        className="feature-band"
        heading={<Trans>The details</Trans>}
        id="details"
        lede={
            <p className="feature-section-lede">
                <Trans>For when you want to know exactly how it behaves.</Trans>
            </p>
        }
    >
        {children}
    </FeatureSplitSection>
);

export const FeatureDetails = Object.assign(FeatureDetailsRoot, {
    Item: FeatureDetailsItem,
    Guides: FeatureDetailsGuides
});
