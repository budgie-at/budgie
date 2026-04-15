import { TransactionExpenseWithRelationsEntityInterface } from '../entity/transaction-expense-with-relations-entity-interface.type';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity-interface.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isExpenseTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionExpenseWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.EXPENSE;
