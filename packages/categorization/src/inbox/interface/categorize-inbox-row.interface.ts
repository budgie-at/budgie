import { TransactionTypeEnum } from '@budgie/contracts';

export interface CategorizeInboxRowInterface {
    readonly transactionId: number;
    readonly type: TransactionTypeEnum;
    readonly title: string;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly baseInstrumentId: number | null;
    readonly instrumentSymbol: string;
    readonly mccCategoryId: number | null;
    readonly categoryId: number | null;
    readonly tagIds: number[];
    readonly mcc: string | null;
}
