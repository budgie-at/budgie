import { TransactionIncomeWithRelationsEntityInterface } from '../entity/transaction-income-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { AnyTransactionWithRelationsEntityType } from '../type/any-transaction-with-relations-entity.type';

export const isIncomeTransaction = (
    transaction: AnyTransactionWithRelationsEntityType
): transaction is TransactionIncomeWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.INCOME;
