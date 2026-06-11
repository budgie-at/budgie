import { TransactionInfoRoute } from '../../../../transaction/components/transaction-info-route/transaction-info-route';
import { TransferTransactionInfoPage } from '../../../../transaction/components/transfer-transaction-info-page/transfer-transaction-info-page';

export default function TransferTransactionInfoRoute() {
    return (
        <TransactionInfoRoute>
            {(transaction, transactionId) => <TransferTransactionInfoPage transaction={transaction} transactionId={transactionId} />}
        </TransactionInfoRoute>
    );
}
