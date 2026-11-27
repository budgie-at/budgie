import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListMonthItemInterface {
    readonly kind: YieldListItemKindEnum.MONTH;
    readonly id: string;
    readonly month: Date;
    readonly total: number | null;
}
