import type { YieldDeltaKindEnum } from '../enum/yield-delta-kind.enum';

export interface YieldDeltaInterface {
    readonly kind: YieldDeltaKindEnum;
    readonly ratio: number | null;
}
