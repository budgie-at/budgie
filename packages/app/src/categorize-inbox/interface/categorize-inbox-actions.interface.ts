import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';
import type { CategorizeInboxLastWriteInterface } from './categorize-inbox-last-write.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly items: CategorizeInboxListItemType[];
    readonly expandedClusterKey: string | null;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly undo: () => void;
    readonly remainingCount: number;
    readonly categorizedCount: number;
}
