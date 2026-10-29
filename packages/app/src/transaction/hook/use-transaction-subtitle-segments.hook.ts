import {
    DebtEventAssociationEnum,
    DebtEventDirectionEnum,
    TransactionTypeEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionCounterparty } from '../utils/get-transaction-counterparty.util';
import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';
import { isUncategorizedTransaction } from '../utils/is-uncategorized-transaction.util';

import { useRefundedLabel } from './use-refunded-label.hook';
import { useTransactionFeeLabel } from './use-transaction-fee-label.hook';

import type { TransactionSubtitleSegmentsInterface } from '../interface/transaction-subtitle-segments.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useTransactionSubtitleSegments = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): TransactionSubtitleSegmentsInterface => {
    const { t } = useLingui();
    const refundedLabel = useRefundedLabel(transaction);
    const feeLabel = useTransactionFeeLabel(transaction);

    const counterparty = getTransactionCounterparty(transaction, accountId);
    const displayTitle = getTransactionDisplayTitle(transaction);
    const source = counterparty?.source;
    const destination = counterparty?.destination;
    const categoryLabels =
        transaction.type === TransactionTypeEnum.TRANSFER
            ? []
            : getTransactionCategoryEntries(transaction.entries)
                  .map(entry => entry.category?.title)
                  .filter(isDefined);
    const moneyAccount = transaction.fromAccount ?? transaction.toAccount;
    const counterpartyLabel = [
        isNotEmptyString(source) && isNotEmptyString(destination) ? t`From ${source} to ${destination}` : null,
        isNotEmptyString(destination) ? t`To ${destination}` : null,
        isNotEmptyString(source) ? t`From ${source}` : null
    ]
        .filter(isNotEmptyString)
        .find(label => label.toLowerCase() !== displayTitle.toLowerCase());
    const debtEvent = transaction.debtEvents.at(0);
    const repaidDebtAccount =
        debtEvent?.direction === DebtEventDirectionEnum.CLOSE ? debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT] : null;
    const repaidDebtTitle =
        isDefined(repaidDebtAccount) && !displayTitle.includes(repaidDebtAccount.title) ? repaidDebtAccount.title : null;

    const { relationSegments, ownAccountTitle } = isDefined(repaidDebtAccount)
        ? { relationSegments: [t`Repayment`, repaidDebtTitle], ownAccountTitle: null }
        : {
              relationSegments: [
                  counterpartyLabel ?? (transaction.type === TransactionTypeEnum.TRANSFER ? t`Transfer` : categoryLabels.join(', '))
              ],
              ownAccountTitle:
                  !isDefined(counterparty) && isDefined(moneyAccount) && moneyAccount.id !== accountId ? moneyAccount.title : null
          };

    return {
        segments: [
            refundedLabel,
            isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction) ? t`Manual adjustment` : null,
            isUncategorizedTransaction(transaction) ? t`Uncategorized` : null,
            ...relationSegments
        ].filter(isNotEmptyString),
        feeLabel,
        accountTitle: ownAccountTitle,
        categoryLabel: !isDefined(counterparty) && categoryLabels.length === 1 ? (categoryLabels.at(0) ?? null) : null
    };
};
