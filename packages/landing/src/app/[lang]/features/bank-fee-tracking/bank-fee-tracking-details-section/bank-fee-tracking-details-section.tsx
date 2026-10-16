import { Trans } from '@lingui/react/macro';

import { FeatureDetails } from '../../../../../feature/component/feature-details/feature-details';
import { FEATURE_METADATA } from '../metadata';

interface Props {
    readonly locale: string;
}

export const BankFeeTrackingDetailsSection = ({ locale }: Props) => (
    <FeatureDetails>
        <FeatureDetails.Item index={0} title={<Trans>Why fees need their own entry type</Trans>}>
            <p>
                <Trans>
                    A cash withdrawal is a transfer from your bank account to cash, but the ATM commission is still a real expense. If both
                    are forced into one category, either transfers pollute spending or fees disappear from analytics.
                </Trans>
            </p>
            <p>
                <Trans>
                    Budgie treats the main movement and the bank fee separately. The transfer stays a transfer. The fee gets its own amount
                    and category, so your reports show what the bank actually charged you.
                </Trans>
            </p>
        </FeatureDetails.Item>
        <FeatureDetails.Guides index={1} locale={locale} slugs={FEATURE_METADATA.relatedArticleSlugs} />
    </FeatureDetails>
);
