import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

export interface CategorizeInboxLastWriteInterface {
    readonly assignments: CategorizeInboxAssignmentInterface[];
    readonly followUpAssignments: CategorizeInboxAssignmentInterface[];
}
