import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionCategoryFilterModeEnum } from '../enum/transaction-category-filter-mode.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionFilterInterface {
    readonly types: TransactionTypeEnum[] | null;
    readonly date: DateRangeInterface | null;
    readonly categoryMode: TransactionCategoryFilterModeEnum;
    readonly categoryIds: number[] | null;
    readonly accountIds: number[] | null;
    readonly tagIds: number[] | null;
}
