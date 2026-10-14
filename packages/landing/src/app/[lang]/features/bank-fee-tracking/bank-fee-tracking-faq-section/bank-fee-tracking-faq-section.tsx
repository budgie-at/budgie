import { Trans } from '@lingui/react/macro';

import { FeatureFaq } from '../../../../../feature/component/feature-faq/feature-faq';

interface Props {
    readonly locale: string;
}

export const BankFeeTrackingFaqSection = ({ locale }: Props) => (
    <FeatureFaq locale={locale}>
        <FeatureFaq.Item
            index={0}
            question={<Trans>Do fees show up in analytics?</Trans>}
            answer={<Trans>Yes. Fee entries count toward their selected category, including bank fees attached to transfers.</Trans>}
        />
        <FeatureFaq.Item
            index={1}
            question={<Trans>Does this replace split transactions?</Trans>}
            answer={
                <Trans>
                    No. Splits are for dividing the main amount across categories. Fees are a separate cost attached to the transaction.
                </Trans>
            }
        />
        <FeatureFaq.Item
            index={2}
            question={<Trans>What happens to ATM withdrawals?</Trans>}
            answer={
                <Trans>The cash movement can stay a transfer, while the ATM commission is stored as a bank-fee entry for analytics.</Trans>
            }
        />
    </FeatureFaq>
);
