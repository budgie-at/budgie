import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';

export interface CategorizeInboxSectionHeaderItemInterface {
    readonly kind: CategorizeInboxListItemKindEnum.SECTION_HEADER;
    readonly key: string;
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
}
