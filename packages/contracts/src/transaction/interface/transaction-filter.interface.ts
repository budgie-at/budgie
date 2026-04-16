import { DateRangeInterface } from '../../@generic/interface/date-range.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionFilterInterface {
    types: TransactionTypeEnum[] | null;
    date: DateRangeInterface | null;
    categoryIds: number[] | null;
    accountIds: number[] | null;
    tagIds: number[] | null;
}
