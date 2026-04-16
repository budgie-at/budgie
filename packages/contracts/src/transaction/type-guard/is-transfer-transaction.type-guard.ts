import { TransactionTransferWithRelationsEntityInterface } from '../entity/transaction-transfer-with-relations-entity.interface';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isTransferTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionTransferWithRelationsEntityInterface => transaction.type === TransactionTypeEnum.TRANSFER;
