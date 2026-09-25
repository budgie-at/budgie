import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxContextValueInterface } from './categorize-inbox-context-value.interface';

export interface CategorizeInboxActionsInterface {
    readonly contextValue: CategorizeInboxContextValueInterface;
    readonly confidentRowCount: number;
    readonly undoAssignments: CategorizeInboxAssignmentInterface[] | null;
    readonly assignedRowCount: number;
    readonly singleAssignment: CategorizeInboxAssignmentInterface | null;
    readonly handleAcceptConfidentPress: () => void;
    readonly handleUndoPress: () => void;
    readonly handleDismissUndo: () => void;
    readonly handleShowList: () => void;
    readonly handleGoBack: () => void;
}
