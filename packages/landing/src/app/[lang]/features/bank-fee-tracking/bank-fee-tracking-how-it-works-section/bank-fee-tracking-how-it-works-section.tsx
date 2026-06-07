import { Trans } from '@lingui/react/macro';

import { FeaturePageHeading } from '../../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageProse } from '../../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../../feature/component/feature-page-section/feature-page-section';

export const BankFeeTrackingHowItWorksSection = () => (
    <FeaturePageSection>
        <FeaturePageHeading>
            <Trans>How it works</Trans>
        </FeaturePageHeading>
        <FeaturePageProse>
            <Trans>
                When a bank import includes a commission, Budgie stores it as a fee entry attached to the transaction. You can also add or
                edit a fee manually from the transaction screen. The fee entry keeps its own category and amount while the main transaction
                keeps its original type.
            </Trans>
        </FeaturePageProse>
    </FeaturePageSection>
);
