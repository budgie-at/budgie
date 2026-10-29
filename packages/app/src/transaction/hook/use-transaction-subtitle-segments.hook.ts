import {
    DebtEventAssociationEnum,
    DebtEventDirectionEnum,
    TransactionAssociationEnum,
    TransactionTypeEnum,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';
import { isUncategorizedTransaction } from '../utils/is-uncategorized-transaction.util';

import { useRefundedLabel } from './use-refunded-label.hook';
import { useTransactionFeeLabel } from './use-transaction-fee-label.hook';

import type { TransactionCounterpartyInterface } from '../interface/transaction-counterparty.interface';
import type { TransactionSubtitleSegmentsInterface } from '../interface/transaction-subtitle-segments.interface';
import type { AccountEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const getTransactionCounterparty = (
    transaction: Pick<
        TransactionWithRelationsEntityInterface,
        | 'type'
        | 'title'
        | 'comment'
        | TransactionAssociationEnum.FROM_ACCOUNT
        | TransactionAssociationEnum.TO_ACCOUNT
        | TransactionAssociationEnum.DEBT_EVENTS
    >,
    accountId: number | null
): TransactionCounterpartyInterface | null => {
    const debtAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT];
    const moneyAccount = transaction.fromAccount ?? transaction.toAccount;
    const displayTitle = getTransactionDisplayTitle(transaction);
    const getVisibleTitle = (account: Pick<AccountEntityInterface, 'id' | 'title'>) =>
        account.id === accountId || displayTitle.toLowerCase().includes(account.title.toLowerCase()) ? null : account.title;
    const toCounterparty = (
        source: Pick<AccountEntityInterface, 'id' | 'title'>,
        destination: Pick<AccountEntityInterface, 'id' | 'title'>
    ): TransactionCounterpartyInterface | null => {
        const sourceTitle = getVisibleTitle(source);
        const destinationTitle = getVisibleTitle(destination);

        return isDefined(sourceTitle) || isDefined(destinationTitle) ? { source: sourceTitle, destination: destinationTitle } : null;
    };

    if (isDefined(debtAccount) && isDefined(moneyAccount)) {
        const isIncome = transaction.type === TransactionTypeEnum.INCOME;

        return isIncome ? toCounterparty(debtAccount, moneyAccount) : toCounterparty(moneyAccount, debtAccount);
    }

    if (isDefined(transaction.fromAccount) && isDefined(transaction.toAccount)) {
        return toCounterparty(transaction.fromAccount, transaction.toAccount);
    }

    return null;
};

const getAccountContext = (
    transaction: Pick<
        TransactionWithRelationsEntityInterface,
        TransactionAssociationEnum.FROM_ACCOUNT | TransactionAssociationEnum.TO_ACCOUNT | TransactionAssociationEnum.DEBT_EVENTS
    >,
    accountId: number | null,
    displayTitle: string
) => {
    const debtEvent = transaction.debtEvents.at(0);
    const moneyAccount = transaction.fromAccount ?? transaction.toAccount;
    const repaidDebtAccount =
        debtEvent?.direction === DebtEventDirectionEnum.CLOSE ? debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT] : null;
    const isRepaidDebtTitleVisible =
        isDefined(repaidDebtAccount) && repaidDebtAccount.id !== accountId && !displayTitle.includes(repaidDebtAccount.title);

    return {
        repaidDebtAccount,
        repaidDebtTitle: isRepaidDebtTitleVisible ? repaidDebtAccount.title : null,
        moneyAccountTitle: !isDefined(moneyAccount) || moneyAccount.id === accountId ? null : moneyAccount.title
    };
};

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
    const counterpartyLabel = [
        isNotEmptyString(source) && isNotEmptyString(destination) ? t`From ${source} to ${destination}` : null,
        isNotEmptyString(destination) ? t`To ${destination}` : null,
        isNotEmptyString(source) ? t`From ${source}` : null
    ]
        .filter(isNotEmptyString)
        .find(label => label.toLowerCase() !== displayTitle.toLowerCase());
    const { repaidDebtAccount, repaidDebtTitle, moneyAccountTitle } = getAccountContext(transaction, accountId, displayTitle);

    const { relationSegments, ownAccountTitle } = isDefined(repaidDebtAccount)
        ? {
              relationSegments: [t`Repayment`, repaidDebtTitle],
              ownAccountTitle: moneyAccountTitle
          }
        : {
              relationSegments: [
                  counterpartyLabel ?? (transaction.type === TransactionTypeEnum.TRANSFER ? t`Transfer` : categoryLabels.join(', '))
              ],
              ownAccountTitle: isDefined(counterparty) ? null : moneyAccountTitle
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
