import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { AnyTransactionWithRelationsEntityType } from '../type/any-transaction-with-relations-entity.type';
import {
    TransactionExpenseWithRelationsEntityInterface
} from '../entity/transaction-expense-with-relations-entity.interface';

export const isExpenseTransaction = (
    transaction: AnyTransactionWithRelationsEntityType
): transaction is TransactionExpenseWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.EXPENSE;
