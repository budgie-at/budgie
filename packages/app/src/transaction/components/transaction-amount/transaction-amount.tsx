import {
    isOutflowEntryType,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    convertFromMicroUnits
} from '@budgie/contracts';
import { useContext } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { StatisticsCategoryIdsContext } from '../../context/statistics-category-ids.context';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { selectStatisticsAmountTransaction } from '../../utils/select-statistics-amount-transaction.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionEntryAmount } from '../transaction-entry-amount/transaction-entry-amount';
import { TransactionTransferAmount } from '../transaction-transfer-amount/transaction-transfer-amount';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

const sumEntryBaseAmounts = (entries: TransactionWithRelationsEntityInterface['entries']): number | null => {
    if (entries.some(entry => !isDefined(entry.baseAmount))) {
        return null;
    }

    return entries.reduce((sum, entry) => sum + (entry.baseAmount ?? 0), 0);
};

const getAggregatedEntry = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): AggregatedTransactionEntryInterface | null => {
    const entries = transaction.entries.filter(entry => entry.accountId === accountId);

    return isNotEmptyArray(entries) ? { ...entries[0], amount: sumEntryAmounts(entries), baseAmount: sumEntryBaseAmounts(entries) } : null;
};

const getContextualEntry = (
    transaction: TransactionWithRelationsEntityInterface,
    accountId: number | null
): AggregatedTransactionEntryInterface | null => {
    const entry = getAggregatedEntry(transaction, accountId);

    if (!isDefined(entry) || entry.account.id === transaction.fromAccountId || entry.account.id === transaction.toAccountId) {
        return null;
    }

    return entry;
};

const resolveDisplayEntries = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const contextualEntry = getContextualEntry(transaction, accountId);
    const fromEntry = getAggregatedEntry(transaction, transaction.fromAccountId);
    const toEntry = getAggregatedEntry(transaction, transaction.toAccountId);

    if (!isDefined(contextualEntry)) {
        return { contextualEntry, fromEntry, toEntry };
    }

    if (isOutflowEntryType(contextualEntry.type)) {
        return { contextualEntry, fromEntry: contextualEntry, toEntry };
    }

    return { contextualEntry, fromEntry, toEntry: contextualEntry };
};

export const TransactionAmount = ({ transaction: fullTransaction, accountId = null }: Props) => {
    const statisticsCategoryIds = useContext(StatisticsCategoryIdsContext);
    const transaction = selectStatisticsAmountTransaction(fullTransaction, statisticsCategoryIds);
    const { fromEntry, toEntry } = resolveDisplayEntries(transaction, accountId);
    const amountTestID = TransactionCardSelector.Amount(transaction.id);

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        return <TransactionTransferAmount fromEntry={fromEntry} toEntry={toEntry} testID={amountTestID} />;
    }

    const sideEntry = isDefined(fromEntry) ? fromEntry : toEntry;

    if (!isDefined(sideEntry)) {
        return null;
    }

    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const sideVariant = TRANSACTION_COLOR[getTransactionType(transaction)];
    const sideTestID = isAdjustment ? TransactionCardSelector.AdjustmentAmount(convertFromMicroUnits(sideEntry.amount)) : amountTestID;

    return <TransactionEntryAmount debtEvent={transaction.debtEvents.at(0)} entry={sideEntry} variant={sideVariant} testID={sideTestID} />;
};
