import type { TransactionsByMonthSection } from '../interface/transactions-by-month-section.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const groupTransactionsByMonth = (
    transactions: TransactionWithRelationsEntityInterface[],
    formatMonthAndYear: (date: Date | string) => string
): TransactionsByMonthSection[] => {
    const sections: TransactionsByMonthSection[] = [];

    for (const transaction of transactions) {
        const month = formatMonthAndYear(transaction.operatedAt);
        const last = sections.at(-1);

        if (last?.date === month) {
            last.transactions.push(transaction);
        } else {
            sections.push({ date: month, transactions: [transaction] });
        }
    }

    return sections;
};
