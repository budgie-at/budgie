import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionCategoryFilterModeEnum } from '../../transaction/enum/transaction-category-filter-mode.enum';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface StatisticsFilterInterface {
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly date: DateRangeInterface | null;
    readonly categoryMode: TransactionCategoryFilterModeEnum;
    readonly categoryIds: number[] | null;
    readonly tagIds: number[] | null;
}
