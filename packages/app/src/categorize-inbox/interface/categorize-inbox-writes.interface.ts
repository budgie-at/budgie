import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxLastWriteInterface } from './categorize-inbox-last-write.interface';

export interface CategorizeInboxWritesInterface {
    readonly lastWrite: CategorizeInboxLastWriteInterface | null;
    readonly assign: (assignments: CategorizeInboxAssignmentInterface[]) => void;
    readonly applyFollowUp: (assignment: CategorizeInboxAssignmentInterface) => Promise<void>;
    readonly undo: () => void;
}
