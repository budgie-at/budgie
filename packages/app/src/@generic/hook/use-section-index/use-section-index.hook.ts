import { useRef, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { SelectorListRowInterface } from '../../interface/selector-list-row.interface';
import type { LegendListRef, OnViewableItemsChangedInfo } from '@legendapp/list/react-native';

const MIN_INDEXED_SECTIONS = 5;
const FEATURED_SECTION_MARK = '★';

export const useSectionIndex = <T>(rows: readonly SelectorListRowInterface<T>[]) => {
    const listRef = useRef<LegendListRef>(null);
    const [visibleLetter, setVisibleLetter] = useState<string | null>(null);

    const letters = rows.flatMap(row => (!isDefined(row.item) && isDefined(row.indexLetter) ? [row.indexLetter] : []));
    const featuredMark = isDefined(rows[0]) && !isDefined(rows[0].indexLetter) ? [FEATURED_SECTION_MARK] : [];
    const sectionLetterByRow = rows.map(row => row.indexLetter ?? FEATURED_SECTION_MARK);

    const handleSectionLetter = (letter: string) => {
        const index = letter === FEATURED_SECTION_MARK ? 0 : rows.findIndex(row => !isDefined(row.item) && row.indexLetter === letter);

        setVisibleLetter(letter);
        void listRef.current?.scrollToIndex({ index, animated: false, viewOffset: 0 });
    };
    const handleViewableItemsChanged = ({ viewableItems }: OnViewableItemsChangedInfo<SelectorListRowInterface<T>>) => {
        const state = listRef.current?.getState();
        const visibleTop = state?.scroll ?? 0;
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
