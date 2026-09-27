import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';

export interface CategorizeInboxLastWriteInterface {
    readonly sequence: number;
    readonly assignments: CategorizeInboxAssignmentInterface[];
    readonly followUpAssignments: CategorizeInboxAssignmentInterface[];
}
