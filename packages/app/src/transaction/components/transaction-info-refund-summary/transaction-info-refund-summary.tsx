import { TransactionEntryTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionInfoPrimaryEntry } from '../../utils/get-transaction-info-primary-entry.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoRefundSummary = ({ transaction }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const { sources } = useGetConsolidationSourcesQuery(transaction.id);
    const purchase = getTransactionInfoPrimaryEntry(transaction);
    const refunds = sources.filter(source => source.entryType === TransactionEntryTypeEnum.DEBIT);

    if (!isDefined(purchase) || !isNotEmptyArray(refunds)) {
        return null;
    }

    const refundedTotal = sumEntryAmounts(refunds);
    const originalAmount = sumEntryAmounts(
        getTransactionCategoryEntries(transaction.entries).filter(
            entry => entry.type === TransactionEntryTypeEnum.CREDIT && entry.accountId === purchase.accountId
        )
    );
    const original = formatDigits(convertFromMicroUnits(originalAmount), purchase.account.instrument.symbol);
    const refunded = formatDigits(-convertFromMicroUnits(refundedTotal), purchase.account.instrument.symbol);
    const net = formatDigits(convertFromMicroUnits(originalAmount - refundedTotal), purchase.account.instrument.symbol);
    const merchant = getTransactionDisplayTitle(transaction);

    return (
        <TransactionInfoRow
            icon={UserIconNameEnum.RotateCcw}
            label={t`Refund of ${merchant} · ${original}`}
            value={t`${refunded} refunded · ${net} net`}
            testID={TransactionInfoPageSelector.Row.RefundSummary}
        />
    );
};
