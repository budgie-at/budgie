import { TransactionEntryCreateEntityInterface } from '../transaction-entry/entity/transaction-entry-create-entity.interface';
import { TransactionEntryTypeEnum } from '../transaction-entry/enum/transaction-entry-type.enum';

export const createTransferTransactionEntryInput = (
    accountId: number,
    type: TransactionEntryTypeEnum,
    amount: number
): TransactionEntryCreateEntityInterface => ({
    type,
    amount,
    accountId,
    categoryId: 0,
    instrumentId: 0,
    transactionId: 0
});
