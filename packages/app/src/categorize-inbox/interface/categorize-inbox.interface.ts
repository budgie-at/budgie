import { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

import { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';

export interface CategorizeInboxInterface {
    readonly items: CategorizeInboxListItemType[];
    readonly totalRowCount: number;
    readonly confidentRowCount: number;
    readonly confidentClusterCount: number;
    readonly confidentAssignments: CategorizeInboxAssignmentInterface[];
}
