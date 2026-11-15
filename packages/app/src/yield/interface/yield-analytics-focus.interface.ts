import type { YieldRangeEnum } from '@budgie/market';

export interface YieldAnalyticsFocusInterface {
    readonly range: YieldRangeEnum;
    readonly focusDay: string | null;
}
