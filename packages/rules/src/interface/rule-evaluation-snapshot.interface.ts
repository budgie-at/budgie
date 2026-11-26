import type { ExternalSourceEnum, TransactionTypeEnum } from '@budgie/contracts';

export interface RuleEvaluationSnapshotInterface {
    readonly type: TransactionTypeEnum;
    readonly lowerType: string;
    readonly rawTitle: string;
    readonly lowerTitle: string;
    readonly rawComment: string;
    readonly lowerComment: string;
    readonly amount: number;
    readonly accountId: number | null;
    readonly rawExternalSource: ExternalSourceEnum | null;
    readonly lowerExternalSource: string | null;
    readonly rawMccCode: string | null;
    readonly lowerMccCode: string | null;
}
