import { isNotEmptyArray } from '@rnw-community/shared';

import { ICON_SELECTOR_COLUMNS } from '../constant/icon-selector-columns.constant';
import { SelectorRowKindEnum } from '../enum/selector-row-kind.enum';

import type { IconSelectorRowInterface } from '../interface/icon-selector-row.interface';
import type { IconSelectorSectionInterface } from '../interface/icon-selector-section.interface';

export const buildIconSelectorRows = (sections: readonly IconSelectorSectionInterface[]): IconSelectorRowInterface[] =>
    sections
        .filter(({ entries }) => isNotEmptyArray(entries))
        .flatMap(({ id, title, entries }) => [
            { key: id, kind: SelectorRowKindEnum.TITLE, title, entries: [] },
            ...Array.from({ length: Math.ceil(entries.length / ICON_SELECTOR_COLUMNS) }, (_, index) => ({
                key: `${id}-${index}`,
                kind: SelectorRowKindEnum.ITEM,
                title: null,
                entries: entries.slice(index * ICON_SELECTOR_COLUMNS, (index + 1) * ICON_SELECTOR_COLUMNS)
            }))
        ]);
