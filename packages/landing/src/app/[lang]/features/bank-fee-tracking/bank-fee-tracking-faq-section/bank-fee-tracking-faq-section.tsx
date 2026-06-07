import { Trans } from '@lingui/react/macro';

import { FeaturePageFaqItem } from '../../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../../feature/component/feature-page-faq-section/feature-page-faq-section';

interface Props {
    readonly locale: string;
}

export const BankFeeTrackingFaqSection = ({ locale }: Props) => (
    <FeaturePageFaqSection locale={locale}>
        <FeaturePageFaqItem
            question={<Trans>Do fees show up in analytics?</Trans>}
            answer={<Trans>Yes. Fee entries count toward their selected category, including bank fees attached to transfers.</Trans>}
        />
        <FeaturePageFaqItem
            question={<Trans>Does this replace split transactions?</Trans>}
            answer={
                <Trans>
                    No. Splits are for dividing the main amount across categories. Fees are a separate cost attached to the transaction.
                </Trans>
            }
        />
        <FeaturePageFaqItem
            question={<Trans>What happens to ATM withdrawals?</Trans>}
            answer={
                <Trans>The cash movement can stay a transfer, while the ATM commission is stored as a bank-fee entry for analytics.</Trans>
            }
        />
    </FeaturePageFaqSection>
);
