import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface LabelEvidenceRowInterface {
    readonly title: string;
    readonly type: TransactionTypeEnum;
    readonly mccCategoryId: number | null;
    readonly labelId: number;
    readonly count: number;
}
