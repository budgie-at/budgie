import { TransactionExpenseWithRelationsEntityInterface } from '../entity/transaction-expense-with-relations-entity.interface';
import { TransactionIncomeWithRelationsEntityInterface } from '../entity/transaction-income-with-relations-entity.interface';
import { TransactionTransferWithRelationsEntityInterface } from '../entity/transaction-transfer-with-relations-entity.interface';

export type AnyTransactionWithRelationsEntityType =
    | TransactionIncomeWithRelationsEntityInterface
    | TransactionExpenseWithRelationsEntityInterface
    | TransactionTransferWithRelationsEntityInterface;
