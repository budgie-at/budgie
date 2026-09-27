import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly items: CategorizeInboxListItemType[];
    readonly expandedClusterKey: string | null;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly undoAssignments: CategorizeInboxAssignmentInterface[] | null;
    readonly undo: () => void;
    readonly remainingCount: number;
    readonly categorizedCount: number;
}
