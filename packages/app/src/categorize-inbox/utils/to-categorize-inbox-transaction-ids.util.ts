import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

export const toCategorizeInboxTransactionIds = (assignments: CategorizeInboxAssignmentInterface[]): number[] =>
    assignments.flatMap(assignment => assignment.rows.map(row => row.transactionId));
