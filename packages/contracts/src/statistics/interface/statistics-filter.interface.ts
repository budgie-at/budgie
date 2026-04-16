import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface StatisticsFilterInterface {
    type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    date: DateRangeInterface | null;
    categoryIds: number[] | null;
    tagIds: number[] | null;
}
