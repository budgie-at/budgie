import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListOlderItemInterface {
    readonly kind: YieldListItemKindEnum.OLDER;
    readonly id: string;
}
