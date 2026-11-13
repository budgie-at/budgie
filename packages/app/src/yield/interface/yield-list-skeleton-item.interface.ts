import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';

export interface YieldListSkeletonItemInterface {
    readonly kind: YieldListItemKindEnum.SKELETON;
    readonly id: string;
}
