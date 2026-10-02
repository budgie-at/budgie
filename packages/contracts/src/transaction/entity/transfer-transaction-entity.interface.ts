import type { TransactionTypeEnum } from '../enum/transaction-type.enum';
import type { TransactionEntityInterface } from './transaction-entity.interface';

export type TransferTransactionEntityInterface = Omit<TransactionEntityInterface, 'type'> & { readonly type: TransactionTypeEnum.TRANSFER };
