import { UpdateExpenseTransaction } from '../../../../../transaction/components/update-expense-transaction/update-expense-transaction';
import { UpdateTransactionRoute } from '../../../../../transaction/components/update-transaction-route/update-transaction-route';

export default function UpdateExpenseTransactionPage() {
    return <UpdateTransactionRoute Component={UpdateExpenseTransaction} />;
}
