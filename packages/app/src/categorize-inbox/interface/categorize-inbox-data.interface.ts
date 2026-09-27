import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';
import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxVisibilityInterface } from './categorize-inbox-visibility.interface';

export interface CategorizeInboxDataInterface {
    readonly isLoading: boolean;
    readonly items: CategorizeInboxListItemType[];
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly visibility: CategorizeInboxVisibilityInterface;
}
