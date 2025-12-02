import { DatePeriodEnum } from '../../generic/enum/date-period.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface TransactionFilterInterface {
    type: TransactionTypeEnum | null;
    accountId: number | null;
    period: DatePeriodEnum;
}
