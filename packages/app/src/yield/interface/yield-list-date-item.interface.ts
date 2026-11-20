import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListDateItemInterface {
    readonly kind: YieldListItemKindEnum.DATE;
    readonly id: string;
    readonly date: Date;
}
