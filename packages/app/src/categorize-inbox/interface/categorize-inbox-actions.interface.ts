import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly items: CategorizeInboxListItemType[];
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly progress: number;
}
