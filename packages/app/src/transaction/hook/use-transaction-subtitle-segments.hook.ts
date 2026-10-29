import { convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries, getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { getTransactionCounterparty } from '../utils/get-transaction-counterparty.util';
import { sumEntryAmounts } from '../utils/sum-entry-amounts.util';

import { useRefundedLabel } from './use-refunded-label.hook';

import type { TransactionSubtitleSegmentsInterface } from '../interface/transaction-subtitle-segments.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionSubtitleSegments = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): TransactionSubtitleSegmentsInterface => {
    const { t } = useLingui();
    const formatDigits = useDisplayFormatDigits();
    const refundedLabel = useRefundedLabel(transaction);

    const counterparty = getTransactionCounterparty(transaction, accountId);
    const source = counterparty?.source;
    const destination = counterparty?.destination;
    const categoryLabels = getTransactionCategoryEntries(transaction.entries)
        .map(entry => entry.category?.title)
        .filter(isDefined);
    const moneyAccount = transaction.fromAccount ?? transaction.toAccount;
    const feeEntries = getTransactionFeeEntries(transaction.entries);
    const feeAmount = convertFromMicroUnits(sumEntryAmounts(feeEntries));
    const feeSymbol = feeEntries.at(0)?.account.instrument.symbol;
    const formattedAmount = isPositiveNumber(feeAmount) && isDefined(feeSymbol) ? formatDigits(feeAmount, feeSymbol) : null;
    const counterpartyLabel = [
        isNotEmptyString(source) && isNotEmptyString(destination) ? t`From ${source} to ${destination}` : null,
        isNotEmptyString(destination) ? t`To ${destination}` : null,
        isNotEmptyString(source) ? t`From ${source}` : null
    ].find(isNotEmptyString);
    const hasOwnAccount = !isDefined(counterparty) && isDefined(moneyAccount) && moneyAccount.id !== accountId;

    return {
        segments: [
            refundedLabel,
            isDefined(transaction.receipt) ? t`Receipt` : null,
            counterpartyLabel ?? categoryLabels.join(', '),
            hasOwnAccount ? moneyAccount.title : null,
            isDefined(formattedAmount) ? t`Fee ${formattedAmount}` : null
        ].filter(isNotEmptyString),
        categoryLabel: !isDefined(counterparty) && categoryLabels.length === 1 ? (categoryLabels.at(0) ?? null) : null
    };
};
