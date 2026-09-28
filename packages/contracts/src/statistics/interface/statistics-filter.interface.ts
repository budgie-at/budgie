import { AmountRangeInterface } from '../../@generic/interface/amount-range.interface';
import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface StatisticsFilterInterface {
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE | null;
    readonly date: DateRangeInterface | null;
    readonly categoryIds: number[] | null;
    readonly excludedCategoryIds: number[] | null;
    readonly tagIds: number[] | null;
    readonly accountIds: number[] | null;
    readonly amount: AmountRangeInterface | null;
}
