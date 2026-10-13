import { TransactionTypeEnum } from '@budgie/contracts';

import { ExpenseTransactionInfoPage } from '../../../../transaction/components/expense-transaction-info-page/expense-transaction-info-page';
import { TransactionInfoRoute } from '../../../../transaction/components/transaction-info-route/transaction-info-route';

export default function ExpenseTransactionInfoRoute() {
    return (
        <TransactionInfoRoute transactionType={TransactionTypeEnum.EXPENSE}>
            {transaction => <ExpenseTransactionInfoPage transaction={transaction} />}
        </TransactionInfoRoute>
    );
}
