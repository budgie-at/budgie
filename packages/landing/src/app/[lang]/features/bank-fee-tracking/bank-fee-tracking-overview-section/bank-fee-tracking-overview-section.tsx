import { Trans } from '@lingui/react/macro';

import { FeaturePageHeading } from '../../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../../feature/component/feature-page-section/feature-page-section';

export const BankFeeTrackingOverviewSection = () => (
    <FeaturePageSection>
        <FeaturePageHeading>
            <Trans>Why fees need their own entry type</Trans>
        </FeaturePageHeading>
        <FeaturePageProse>
            <Trans>
                A cash withdrawal is a transfer from your bank account to cash, but the ATM commission is still a real expense. If both are
                forced into one category, either transfers pollute spending or fees disappear from analytics.
            </Trans>
        </FeaturePageProse>
        <FeaturePageProse>
            <Trans>
                Budgie treats the main movement and the bank fee separately. The transfer stays a transfer. The fee gets its own amount and
                category, so your reports show what the bank actually charged you.
            </Trans>
        </FeaturePageProse>
    </FeaturePageSection>
);
