import { AccountWithInstrumentEntityInterface, CurrencyEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FALLBACK_CATEGORY_ID } from '../constant/llm-categorization.constant';
import { AITransactionInterface } from '../interface/ai-transaction.interface';

export interface TransactionEntryInputInterface {
    categoryId: number;
    amount: number;
}

export interface GroupedTransactionInterface {
    categoryId: number;
    amount: number;
    currency: CurrencyEnum | null;
    account: AccountWithInstrumentEntityInterface | null;
    comment: string;
    entries: TransactionEntryInputInterface[];
}

export const groupTransactionsByCategory = (transactions: AITransactionInterface[]): GroupedTransactionInterface | null => {
    if (!isNotEmptyArray(transactions)) {
        return null;
    }

    const grouped = new Map<number, { amount: number; transactions: AITransactionInterface[] }>();

    for (const transaction of transactions) {
        const categoryId = transaction.category?.id ?? FALLBACK_CATEGORY_ID;
        const existing = grouped.get(categoryId);

        if (isDefined(existing)) {
            existing.amount += transaction.amount;
            existing.transactions.push(transaction);
        } else {
            grouped.set(categoryId, { amount: transaction.amount, transactions: [transaction] });
        }
    }

    const sorted = [...grouped.entries()].sort((first, second) => second[1].amount - first[1].amount);
    const [[mainCategoryId, mainData]] = sorted;
    const [mainTransaction] = mainData.transactions;

    const entries: TransactionEntryInputInterface[] = sorted.slice(1).map(([categoryId, data]) => ({
        categoryId,
        amount: data.amount
    }));

    return {
        categoryId: mainCategoryId,
        amount: mainData.amount,
        currency: mainTransaction.currency,
        account: mainTransaction.account,
        comment: mainTransaction.comment,
        entries
    };
};
