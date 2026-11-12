import type { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export interface InstrumentPositionEntryRowInterface {
    readonly isAdjustment?: boolean;
    readonly isInstrumentTransfer?: boolean;
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly feeBaseAmount?: number | null;
    readonly baseAmount: number | null;
}
