import type { YieldGroupEnum } from '../enum/yield-group.enum';
import type { InstrumentTypeEnum, YieldKindEnum } from '@budgie/contracts';

export interface YieldFactInterface {
    readonly kind: YieldKindEnum;
    readonly group: YieldGroupEnum | null;
    readonly day: string;
    readonly priceDay: string;
    readonly units: number;
    readonly value: number;
    readonly isEstimated: boolean;
    readonly landingInstrumentId: number;
    readonly landingInstrumentCode: string;
    readonly landingInstrumentType: InstrumentTypeEnum;
    readonly positionAccountId: number | null;
}
