import type { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';
import type { LanguageEnum, TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface StatisticsDrillDownKeyInterface {
    readonly kind: CategorizeInboxKindEnum;
    readonly entityId: number;
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly filters: TransactionFilterInterface;
    readonly trendMonths: readonly Date[];
    readonly defaultInstrumentId: number;
    readonly language: LanguageEnum;
}
