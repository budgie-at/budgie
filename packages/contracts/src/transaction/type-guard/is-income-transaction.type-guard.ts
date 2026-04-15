import { TransactionIncomeWithRelationsEntityInterface } from '../entity/transaction-income-with-relations-entity-interface.type';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity-interface.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isIncomeTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionIncomeWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.INCOME;
