import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';

export interface CategorizeInboxFollowUpInterface {
    readonly title: string;
    readonly accessibilityLabel: string;
    readonly writeFailed: string;
    readonly pickLabelIds: (assignment: CategorizeInboxAssignmentInterface) => Promise<number[] | null>;
    readonly assignMany: (assignments: CategorizeInboxAssignmentInterface[]) => Promise<CategorizeInboxAssignmentInterface[]>;
    readonly undo: (assignments: CategorizeInboxAssignmentInterface[]) => Promise<void>;
}
