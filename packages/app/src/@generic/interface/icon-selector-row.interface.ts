import type { IconSearchEntryInterface } from './icon-search-entry.interface';

export interface IconSelectorRowInterface {
    readonly key: string;
    readonly title: string | null;
    readonly entries: readonly IconSearchEntryInterface[];
}
