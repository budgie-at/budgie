import type { YieldGroupEnum } from '../enum/yield-group.enum';
import type { YieldRangeEnum } from '../enum/yield-range.enum';

export interface YieldQueryKeyInterface {
    readonly range: YieldRangeEnum;
    readonly positionAccountId: number | null;
    readonly instrumentId: number | null;
    readonly group: YieldGroupEnum | null;
    readonly baseInstrumentId: number;
}
