import type { IconCategoryEnum } from '../enum/icon-category.enum';
import type { IconSearchEntryInterface } from './icon-search-entry.interface';

export interface IconCategorySectionInterface {
    readonly category: IconCategoryEnum;
    readonly entries: readonly IconSearchEntryInterface[];
}
