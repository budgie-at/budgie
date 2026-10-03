import type { CategorizeInboxVisibilityInterface } from './categorize-inbox-visibility.interface';
import type { CategorizeInboxAssignmentInterface, CategorizeInboxListItemType } from '@budgie/categorization';

export interface CategorizeInboxDataInterface {
    readonly isLoading: boolean;
    readonly items: CategorizeInboxListItemType[];
    readonly remainingCount: number;
    readonly categorizedCount: number;
    readonly acceptableAssignments: CategorizeInboxAssignmentInterface[];
    readonly visibility: CategorizeInboxVisibilityInterface;
}
