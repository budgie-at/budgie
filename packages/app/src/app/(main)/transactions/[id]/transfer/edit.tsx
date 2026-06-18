import { UpdateTransactionRoute } from '../../../../../transaction/components/update-transaction-route/update-transaction-route';
import { UpdateTransferTransaction } from '../../../../../transaction/components/update-transfer-transaction/update-transfer-transaction';

export default function EditTransferTransactionRoute() {
    return <UpdateTransactionRoute Component={UpdateTransferTransaction} />;
}
