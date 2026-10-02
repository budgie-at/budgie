import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export interface CategorizeInboxAssignmentInterface {
    readonly key: string;
    readonly displayTitle: string;
    readonly labelId: number;
    readonly rows: CategorizeInboxRowInterface[];
    readonly ruleConditionValue: string;
}
