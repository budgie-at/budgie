import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import type { YieldPositionSummaryInterface } from '@budgie/market';

export interface YieldListPositionItemInterface {
    readonly kind: YieldListItemKindEnum.POSITION;
    readonly id: string;
    readonly position: YieldPositionSummaryInterface;
    readonly rangeCaption: string;
}
