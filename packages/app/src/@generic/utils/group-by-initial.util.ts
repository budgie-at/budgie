import { isDefined } from '@rnw-community/shared';

import type { SelectorSectionInterface } from '../interface/selector-section.interface';

const LETTER_PATTERN = /^[A-Z]$/u;

export const groupByInitial = <T extends { readonly name: string }>(items: readonly T[]): SelectorSectionInterface<T>[] => {
    const groups = new Map<string, T[]>();

    items.forEach(item => {
        const letter = item.name.charAt(0).toUpperCase();
        const initial = LETTER_PATTERN.test(letter) ? letter : '#';
        const group = groups.get(initial);

        if (isDefined(group)) {
            group.push(item);
        } else {
            groups.set(initial, [item]);
        }
    });

    return Array.from(groups, ([title, data]) => ({ title, data })).sort(
        (first, second) => Number(first.title === '#') - Number(second.title === '#')
    );
};
