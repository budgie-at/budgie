import type { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';
import type { TransactionEntityInterface } from './transaction-entity.interface';

export interface TransactionWithEntriesEntityInterface extends TransactionEntityInterface {
    readonly entries: TransactionEntryEntityInterface[];
}
