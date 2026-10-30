import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useDebtAccountProgressSummaryQuery } from '../../../account/query/use-debt-account-progress-summary.query';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const TransactionInfoDebtProgress = ({ account }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const progress = useDebtAccountProgressSummaryQuery(account.id);
    const { symbol } = account.instrument;

    if (!isDefined(progress)) {
        return null;
    }

    const paid = formatDigits(progress.paidAmount, symbol);
    const outstanding = formatDigits(progress.outstandingAmount, symbol);

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.HandCoins}
            label={t`Outstanding`}
            value={outstanding}
            description={t`Paid to date: ${paid}`}
            testID={TransactionInfoPageSelector.Row.DebtProgress}
        />
    );
};
