import type { IconSearchEntryInterface } from './icon-search-entry.interface';

export interface IconSelectorSectionInterface {
    readonly title: string;
    readonly entries: readonly IconSearchEntryInterface[];
}
