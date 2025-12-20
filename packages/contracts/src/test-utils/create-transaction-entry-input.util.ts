import { TransactionEntryCreateEntityInterface } from '../transaction-entry/entity/transaction-entry-create-entity.interface';
import { TransactionEntryTypeEnum } from '../transaction-entry/enum/transaction-entry-type.enum';

export const createTransactionEntryInput = (
    type: TransactionEntryTypeEnum,
    amount: bigint,
    categoryId: number
): TransactionEntryCreateEntityInterface => ({
    type,
    amount,
    categoryId,
    accountId: 1,
    instrumentId: 1,
    transactionId: 1,
});
