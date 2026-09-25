import { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

import { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import { CategorizeInboxClusterInterface } from './categorize-inbox-cluster.interface';

export interface CategorizeInboxInterface {
    readonly clusters: CategorizeInboxClusterInterface[];
    readonly items: CategorizeInboxListItemType[];
    readonly totalRowCount: number;
    readonly confidentRowCount: number;
    readonly confidentAssignments: CategorizeInboxAssignmentInterface[];
}
