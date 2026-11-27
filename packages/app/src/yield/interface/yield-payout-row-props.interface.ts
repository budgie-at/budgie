import type { YieldPayoutDateFormatEnum } from '../enum/yield-payout-date-format.enum';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export interface YieldPayoutRowPropsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly siblings: readonly TransactionWithRelationsEntityInterface[];
    readonly tax: TransactionWithRelationsEntityInterface | null;
    readonly isUnassigned: boolean;
    readonly dateFormat: YieldPayoutDateFormatEnum;
}
