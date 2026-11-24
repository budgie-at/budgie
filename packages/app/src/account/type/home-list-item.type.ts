import type { HomeListItemKindEnum } from '../enum/home-list-item-kind.enum';
import type { HomeSectionInterface } from '../interface/home-section.interface';

export type HomeListItemType =
    | { readonly id: string; readonly type: HomeListItemKindEnum.HEADER; readonly section: HomeSectionInterface }
    | { readonly id: string; readonly type: HomeListItemKindEnum.FOOTER; readonly section: HomeSectionInterface }
    | {
          readonly id: string;
          readonly type:
              | HomeListItemKindEnum.INSTITUTION
              | HomeListItemKindEnum.HOLDING
              | HomeListItemKindEnum.DEBT
              | HomeListItemKindEnum.ACCOUNT;
          readonly item: HomeSectionInterface['data'][number];
          readonly index: number;
          readonly section: HomeSectionInterface;
      };
