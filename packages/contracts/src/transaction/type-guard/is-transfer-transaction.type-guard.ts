import { TransactionTransferWithRelationsEntityInterface } from '../entity/transaction-transfer-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';
import { AnyTransactionWithRelationsEntityType } from '../type/any-transaction-with-relations-entity.type';

export const isTransferTransaction = (
    transaction: AnyTransactionWithRelationsEntityType
): transaction is TransactionTransferWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.TRANSFER;
