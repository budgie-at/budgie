import type { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';

export interface TransactionDayNetAmountRowInterface {
    readonly day: string;
    readonly amount: number;
    readonly baseAmount: number;
    readonly instrumentSymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly hasSecurity: boolean;
    readonly instrumentCount: number;
    readonly unvaluedCount: number;
}
