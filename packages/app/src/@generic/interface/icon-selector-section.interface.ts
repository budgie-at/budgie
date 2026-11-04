import type { IconSelectorSectionEnum } from '../enum/icon-selector-section.enum';
import type { IconSearchEntryInterface } from './icon-search-entry.interface';

export interface IconSelectorSectionInterface {
    readonly id: IconSelectorSectionEnum;
    readonly title: string;
    readonly entries: readonly IconSearchEntryInterface[];
}
