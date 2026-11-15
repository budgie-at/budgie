import type { YieldGroupEnum } from '../enum/yield-group.enum';

export interface YieldGroupTotalInterface {
    readonly group: YieldGroupEnum;
    readonly total: number;
}
