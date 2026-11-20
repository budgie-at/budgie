import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListTruncatedItemInterface {
    readonly kind: YieldListItemKindEnum.TRUNCATED;
    readonly id: string;
    readonly count: number;
}
