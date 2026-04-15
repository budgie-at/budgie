import type { TransactionEntityInterface } from './transaction-entity-interface.type';
import type { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity-interface.type';

export interface TransactionWithEntriesEntityInterface extends TransactionEntityInterface {
    readonly entries: TransactionEntryEntityInterface[];
}
