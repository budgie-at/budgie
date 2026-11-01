import { useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { SELECTOR_TITLED_HEADER_HEIGHT, SELECTOR_TITLED_HEADER_OFFSET } from '../../constant/selector-header-offset.constant';

import type { SelectorListRowInterface } from '../../interface/selector-list-row.interface';
import type { LegendListRef, OnViewableItemsChangedInfo } from '@legendapp/list/react-native';

const MIN_INDEXED_SECTIONS = 5;
const FEATURED_SECTION_MARK = '★';

export const useSectionIndex = <T>(rows: readonly SelectorListRowInterface<T>[]) => {
    const listRef = useRef<LegendListRef>(null);
    const [visibleLetter, setVisibleLetter] = useState<string | null>(null);

    const titles = rows.flatMap(row => (isDefined(row.item) ? [] : [row.title ?? '']));
    const letters = titles.filter(title => Array.from(title).length === 1);
    const featuredMark = isDefined(titles[0]) && !letters.includes(titles[0]) ? [FEATURED_SECTION_MARK] : [];
    const sectionLetterByRow = rows.reduce<string[]>((result, row) => {
        const sectionTitle = isDefined(row.item) ? (result.at(-1) ?? '') : (row.title ?? '');

        return result.concat(letters.includes(sectionTitle) ? sectionTitle : FEATURED_SECTION_MARK);
    }, []);

    const handleSectionLetter = (letter: string) => {
        const index = letter === FEATURED_SECTION_MARK ? 0 : rows.findIndex(row => !isDefined(row.item) && row.title === letter);

        setVisibleLetter(letter);
        void listRef.current?.scrollToIndex({ index, animated: false, viewOffset: SELECTOR_TITLED_HEADER_OFFSET });
    };
    const handleViewableItemsChanged = ({ viewableItems }: OnViewableItemsChangedInfo<SelectorListRowInterface<T>>) => {
        const state = listRef.current?.getState();
        const visibleTop = (state?.scroll ?? 0) + SELECTOR_TITLED_HEADER_HEIGHT;
        const unobscuredIndices = viewableItems
            .map(({ index }) => index)
            .filter(index => isDefined(state) && state.positionAtIndex(index) + state.sizeAtIndex(index) / 2 >= visibleTop);

        setVisibleLetter(current => sectionLetterByRow[Math.min(...unobscuredIndices)] ?? current);
    };

    return {
        listRef,
        sectionLetters: letters.length >= MIN_INDEXED_SECTIONS ? [...featuredMark, ...letters] : [],
        visibleLetter,
        handleSectionLetter,
        handleViewableItemsChanged
    };
};
