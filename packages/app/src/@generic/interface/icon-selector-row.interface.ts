import type { SelectorRowKindEnum } from '../enum/selector-row-kind.enum';
import type { IconSearchEntryInterface } from './icon-search-entry.interface';

export interface IconSelectorRowInterface {
    readonly kind: SelectorRowKindEnum;
    readonly key: string;
    readonly title: string | null;
    readonly entries: readonly IconSearchEntryInterface[];
}
