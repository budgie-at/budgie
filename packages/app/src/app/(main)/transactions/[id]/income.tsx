import { IncomeTransactionInfoPage } from '../../../../transaction/components/income-transaction-info-page/income-transaction-info-page';
import { TransactionInfoRoute } from '../../../../transaction/components/transaction-info-route/transaction-info-route';

export default function IncomeTransactionInfoRoute() {
    return (
        <TransactionInfoRoute>
            {(transaction, transactionId) => <IncomeTransactionInfoPage transaction={transaction} transactionId={transactionId} />}
        </TransactionInfoRoute>
    );
}
