import { Trans } from '@lingui/react/macro';

import { FeatureBenefit } from '../feature-benefit/feature-benefit';
import { FeatureBenefitsIncludedItem } from '../feature-benefits-included-item/feature-benefits-included-item';
import { FeatureBenefitsIncluded } from '../feature-benefits-included/feature-benefits-included';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FeatureBenefitsRoot = ({ children }: Props) => (
    <section aria-labelledby="benefits-heading" className="feature-section feature-plain" id="benefits">
        <div className="feature-wrap container px-4 md:px-6">
            <div className="feature-section-head">
                <h2 className="feature-section-title" id="benefits-heading">
                    <Trans>What you get</Trans>
                </h2>
            </div>
            <div className="feature-benefits">{children}</div>
        </div>
    </section>
);

export const FeatureBenefits = Object.assign(FeatureBenefitsRoot, {
    Benefit: FeatureBenefit,
    Included: FeatureBenefitsIncluded,
    Item: FeatureBenefitsIncludedItem
});
