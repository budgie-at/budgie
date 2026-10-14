import { Trans } from '@lingui/react/macro';
import { Banknote, ChartPie, Receipt } from 'lucide-react';

import { FeatureBenefits } from '../../../../../feature/component/feature-benefits/feature-benefits';

export const BankFeeTrackingBenefitsSection = () => (
    <FeatureBenefits>
        <FeatureBenefits.Benefit icon={Receipt} title={<Trans>Fees on any transaction</Trans>}>
            <Trans>Fees work on expenses, income, and transfers — not only card purchases</Trans>
        </FeatureBenefits.Benefit>
        <FeatureBenefits.Benefit icon={Banknote} title={<Trans>No fake split expenses</Trans>}>
            <Trans>Bank-sync imports create fee entries instead of fake split expenses</Trans>
        </FeatureBenefits.Benefit>
        <FeatureBenefits.Benefit icon={ChartPie} title={<Trans>Fees in your analytics</Trans>}>
            <Trans>Analytics includes fees in their own category, even when the main transaction is a transfer</Trans>
        </FeatureBenefits.Benefit>
        <FeatureBenefits.Included>
            <FeatureBenefits.Item>
                <Trans>Manual fee editing uses a compact bottom sheet for category and amount</Trans>
            </FeatureBenefits.Item>
            <FeatureBenefits.Item>
                <Trans>Fee pills keep the transaction list readable without hiding the cost</Trans>
            </FeatureBenefits.Item>
        </FeatureBenefits.Included>
    </FeatureBenefits>
);
