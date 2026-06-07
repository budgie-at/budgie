import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type {
    DB,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

export interface PersistTransferInputInterface {
    readonly transaction: TransactionEntityInterface;
    readonly input: TransactionCreateInputInterface;
    readonly primaryEntries: readonly TransactionEntryCreateEntityInterface[];
    readonly fromEntry: TransactionEntryCreateInputInterface;
    readonly toEntry: TransactionEntryCreateInputInterface;
    readonly additionalEntryValuations: Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>;
    readonly tx: DB;
}
