import type { CategorizeInboxRowInterface } from '@budgie/contracts';

export interface CategorizeInboxAssignmentInterface {
    readonly clusterKey: string;
    readonly displayTitle: string;
    readonly labelId: number;
    readonly transactionIds: number[];
    readonly rows: CategorizeInboxRowInterface[];
    readonly ruleConditionValue: string;
}
