import type { InstrumentTypeEnum } from '@budgie/contracts';

export interface YieldPricedInstrumentInterface {
    readonly id: number;
    readonly code: string;
    readonly type: InstrumentTypeEnum;
}
