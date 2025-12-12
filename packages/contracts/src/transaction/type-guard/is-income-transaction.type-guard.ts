import { TransactionIncomeWithRelationsEntityInterface } from '../entity/transaction-income-with-relations-entity.interface';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isIncomeTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionIncomeWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.INCOME;
