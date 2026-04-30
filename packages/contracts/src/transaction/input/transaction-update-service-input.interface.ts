import type { TransactionCreateInputInterface } from './transaction-create-input.interface';
import type { TransactionUpdateInputInterface } from './transaction-update-input.interface';

export type TransactionUpdateServiceInputInterface = TransactionUpdateInputInterface &
    Pick<TransactionCreateInputInterface, 'entries' | 'tagIds'>;
