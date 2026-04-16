import type { TransactionEntityInterface } from './transaction-entity.interface';
import type { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';

export interface TransactionWithEntriesEntityInterface extends TransactionEntityInterface {
    readonly entries: TransactionEntryEntityInterface[];
}
