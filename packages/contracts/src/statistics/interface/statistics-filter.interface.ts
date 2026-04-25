import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface StatisticsFilterInterface {
    readonly type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE;
    readonly date: DateRangeInterface | null;
    readonly categoryIds: number[] | null;
    readonly tagIds: number[] | null;
}
