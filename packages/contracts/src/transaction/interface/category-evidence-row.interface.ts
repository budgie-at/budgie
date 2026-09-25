import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface CategoryEvidenceRowInterface {
    readonly title: string;
    readonly type: TransactionTypeEnum;
    readonly mccCategoryId: number | null;
    readonly categoryId: number;
    readonly count: number;
    readonly recentCount: number;
}
