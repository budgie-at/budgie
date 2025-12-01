import { TransactionEntryCreateEntityInterface } from '../transaction-entry/entity/transaction-entry-create-entity.interface';
import { TransactionEntryTypeEnum } from '../transaction-entry/enum/transaction-entry-type.enum';

export const createTransactionEntryInput = (
    type: TransactionEntryTypeEnum,
    amount: number,
    categoryId: number,
): TransactionEntryCreateEntityInterface => ({
    type,
    amount,
    categoryId,
    accountId: 0,
    instrumentId: 0,
    transactionId: 0,
});
