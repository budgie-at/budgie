import { TransactionEntryCreateEntityInterface } from '../transaction-entry/entity/transaction-entry-create-entity.interface';
import { TransactionEntryTypeEnum } from '../transaction-entry/enum/transaction-entry-type.enum';

export const createTransferTransactionEntryInput = (
    accountId: number,
    type: TransactionEntryTypeEnum,
    amount: bigint
): TransactionEntryCreateEntityInterface => ({
    type,
    amount,
    accountId,
    categoryId: 1,
    instrumentId: 1,
    transactionId: 1,
});
