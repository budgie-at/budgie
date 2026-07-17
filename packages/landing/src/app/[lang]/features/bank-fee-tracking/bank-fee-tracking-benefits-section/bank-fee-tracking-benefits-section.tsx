import { Trans } from '@lingui/react/macro';

import { FeaturePageBenefitGridItem } from '../../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageHeading } from '../../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageSection } from '../../../../../feature/component/feature-page-section/feature-page-section';

export const BankFeeTrackingBenefitsSection = () => (
    <FeaturePageSection>
        <FeaturePageHeading>
            <Trans>What you get</Trans>
        </FeaturePageHeading>
        <FeaturePageBenefitGrid>
            <FeaturePageBenefitGridItem index={0}>
                <Trans>Fees work on expenses, income, and transfers — not only card purchases</Trans>
            </FeaturePageBenefitGridItem>
            <FeaturePageBenefitGridItem index={1}>
                <Trans>Bank-sync imports create fee entries instead of fake split expenses</Trans>
            </FeaturePageBenefitGridItem>
            <FeaturePageBenefitGridItem index={2}>
                <Trans>Analytics includes fees in their own category, even when the main transaction is a transfer</Trans>
            </FeaturePageBenefitGridItem>
            <FeaturePageBenefitGridItem index={3}>
                <Trans>Manual fee editing uses a compact bottom sheet for category and amount</Trans>
            </FeaturePageBenefitGridItem>
            <FeaturePageBenefitGridItem index={4}>
                <Trans>Fee pills keep the transaction list readable without hiding the cost</Trans>
            </FeaturePageBenefitGridItem>
        </FeaturePageBenefitGrid>
    </FeaturePageSection>
);
