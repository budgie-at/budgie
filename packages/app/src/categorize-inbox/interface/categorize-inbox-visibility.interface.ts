import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';

export interface CategorizeInboxVisibilityInterface {
    readonly items: CategorizeInboxListItemType[];
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly remainingCount: number;
    readonly excludedTransactionIds: ReadonlySet<number>;
    readonly toggleExcluded: (transactionId: number) => void;
    readonly hideTransactions: (transactionIds: readonly number[]) => void;
    readonly showTransactions: (transactionIds: readonly number[]) => void;
}
