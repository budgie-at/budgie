import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface CategorizeInboxRowInterface {
    readonly transactionId: number;
    readonly type: TransactionTypeEnum;
    readonly title: string;
    readonly comment: string;
    readonly operatedAt: Date;
    readonly accountId: number;
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly baseInstrumentId: number | null;
    readonly instrumentId: number;
    readonly instrumentSymbol: string;
    readonly toIban: string | null;
    readonly mccCategoryId: number | null;
    readonly mccCode: string | null;
    readonly mccDescription: string | null;
}
