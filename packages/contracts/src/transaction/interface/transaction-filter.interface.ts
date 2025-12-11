import { DateFilterInterface } from '../../generic/interface/date-filter.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionFilterInterface {
    type: TransactionTypeEnum | null;
    date: DateFilterInterface | null;
    accountId: number | null;
}
