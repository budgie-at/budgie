import type { InstrumentTypeEnum } from '../../instrument/enum/instrument-type.enum';
import type { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';
import type { YieldKindEnum } from '../../transaction/enum/yield-kind.enum';

export interface YieldFactRowInterface {
    readonly transactionId: number;
    readonly transactionType: TransactionTypeEnum;
    readonly yieldKind: YieldKindEnum;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly baseValue: number;
    readonly isEstimated: boolean;
    readonly landingAccountId: number;
    readonly landingInstrumentId: number;
    readonly landingInstrumentCode: string;
    readonly landingInstrumentType: InstrumentTypeEnum;
    readonly positionAccountId: number | null;
}
