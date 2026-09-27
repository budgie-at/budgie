import type { CategorizeInboxAssignmentInterface } from './categorize-inbox-assignment.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export interface CategorizeInboxFollowUpInterface {
    readonly title: string;
    readonly accessibilityLabel: string;
    readonly suggestLabelIds: (rows: CategorizeInboxRowInterface[]) => number[];
    readonly apply: (assignment: CategorizeInboxAssignmentInterface) => Promise<boolean>;
}
