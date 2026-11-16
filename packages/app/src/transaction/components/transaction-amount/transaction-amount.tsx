import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    convertFromMicroUnits,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useContext } from 'react';

import { isDefined } from '@rnw-community/shared';

import { StatisticsCategoryIdsContext } from '../../context/statistics-category-ids.context';
import { getSecurityTrade } from '../../utils/get-security-trade.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { isEarnedIncomeTransaction } from '../../utils/is-earned-income-transaction.util';
import { resolveTransactionAmountEntries } from '../../utils/resolve-transaction-amount-entries.util';
import { selectStatisticsAmountTransaction } from '../../utils/select-statistics-amount-transaction.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionEntryAmount } from '../transaction-entry-amount/transaction-entry-amount';
import { TransactionSecurityTradeAmount } from '../transaction-security-trade-amount/transaction-security-trade-amount';
import { TransactionTransferAmount } from '../transaction-transfer-amount/transaction-transfer-amount';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionAmount = ({ transaction: fullTransaction, accountId = null }: Props) => {
    const statisticsCategoryIds = useContext(StatisticsCategoryIdsContext);
    const transaction = selectStatisticsAmountTransaction(fullTransaction, statisticsCategoryIds);
    const { fromEntry, toEntry } = resolveTransactionAmountEntries(transaction, accountId);
    const amountTestID = TransactionCardSelector.Amount(transaction.id);

    if (isDefined(fromEntry) && isDefined(toEntry)) {
        const trade = getSecurityTrade(transaction);

        return isDefined(trade) ? (
            <TransactionSecurityTradeAmount trade={trade} accountId={accountId} testID={amountTestID} />
        ) : (
            <TransactionTransferAmount fromEntry={fromEntry} toEntry={toEntry} accountId={accountId} testID={amountTestID} />
        );
    }

    const sideEntry = isDefined(fromEntry) ? fromEntry : toEntry;

    if (!isDefined(sideEntry)) {
        return null;
    }

    const isInflow = getTransactionType(transaction) === TransactionTypeEnum.INCOME;
    const sideVariant = isEarnedIncomeTransaction(transaction) ? 'positive' : 'primary';
    const sign = isInflow ? '+' : '';
    const sideTestID =
        isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)
            ? TransactionCardSelector.AdjustmentAmount(convertFromMicroUnits(sideEntry.amount))
            : amountTestID;

    return (
        <TransactionEntryAmount
            debtEvent={transaction.debtEvents.at(0)}
            entry={sideEntry}
            variant={sideVariant}
            sign={sign}
            testID={sideTestID}
        />
    );
};
