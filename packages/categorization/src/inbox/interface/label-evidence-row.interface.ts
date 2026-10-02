import { TransactionTypeEnum } from '@budgie/contracts';

export interface LabelEvidenceRowInterface {
    readonly title: string;
    readonly type: TransactionTypeEnum;
    readonly mccCategoryId: number | null;
    readonly labelId: number;
    readonly count: number;
}
