import { TransactionTypeEnum } from '@budgie/contracts';

import { SimpleTransactionInfoPage } from '../../../../transaction/components/simple-transaction-info-page/simple-transaction-info-page';
import { TransactionInfoRoute } from '../../../../transaction/components/transaction-info-route/transaction-info-route';

export default function IncomeTransactionInfoRoute() {
    return (
        <TransactionInfoRoute>
            {transaction => <SimpleTransactionInfoPage transaction={transaction} transactionType={TransactionTypeEnum.INCOME} />}
        </TransactionInfoRoute>
    );
}
