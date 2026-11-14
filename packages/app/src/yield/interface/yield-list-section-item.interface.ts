import type { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import type { YieldListSectionEnum } from '../enum/yield-list-section.enum';

export interface YieldListSectionItemInterface {
    readonly kind: YieldListItemKindEnum.SECTION;
    readonly id: string;
    readonly section: YieldListSectionEnum;
}
