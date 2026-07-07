import {
    TransactionEntryTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { getTransactionType } from '../../utils/get-transaction-type.util';
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

    if (contextualEntry.type === TransactionEntryTypeEnum.CREDIT) {
        return { contextualEntry, fromEntry: contextualEntry, toEntry };
    }

    return { contextualEntry, fromEntry, toEntry: contextualEntry };
};

export const TransactionAmount = ({ transaction, accountId = null }: Props) => {
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

    return <TransactionEntryAmount entry={sideEntry} variant={sideVariant} testID={sideTestID} />;
};
