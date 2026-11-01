import { isNotEmptyString } from '@rnw-community/shared';

import type { SelectorListRowInterface } from '../interface/selector-list-row.interface';
import type { SelectorSectionInterface } from '../interface/selector-section.interface';

export const flattenSelectorSections = <T>(
    sections: readonly SelectorSectionInterface<T>[],
    keyExtractor: (item: T) => string
): SelectorListRowInterface<T>[] =>
    sections.flatMap((section, sectionIndex) => {
        const header = isNotEmptyString(section.title)
            ? [{ key: `section-${sectionIndex}`, title: section.title, item: null, isFirst: sectionIndex === 0, isLast: false }]
            : [];
        const rows = section.data.map((item, index) => ({
            key: keyExtractor(item),
            title: null,
            item,
            isFirst: index === 0,
            isLast: index === section.data.length - 1
        }));

        return [...header, ...rows];
    });
