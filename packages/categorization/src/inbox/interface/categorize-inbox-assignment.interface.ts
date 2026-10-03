import type { CategorizeInboxRowInterface } from './categorize-inbox-row.interface';

export interface CategorizeInboxAssignmentInterface {
    readonly key: string;
    readonly displayTitle: string;
    readonly labelId: number;
    readonly rows: CategorizeInboxRowInterface[];
    readonly ruleConditionValue: string;
}
