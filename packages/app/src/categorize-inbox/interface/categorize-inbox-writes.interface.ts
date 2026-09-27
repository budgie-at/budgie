import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';

export interface CategorizeInboxWritesInterface {
    readonly undoAssignments: CategorizeInboxAssignmentInterface[] | null;
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly undo: () => void;
}
