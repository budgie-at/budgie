import { isDefined } from '@rnw-community/shared';

import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { IconSelectorRow } from '../icon-selector-row/icon-selector-row';
import { SelectorList } from '../selector-list/selector-list';

import type { IconSelectorRowInterface } from '../../interface/icon-selector-row.interface';
import type { UserIconType } from '@budgie/contracts';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ReactElement, RefObject } from 'react';

interface Props {
    readonly listRef: RefObject<LegendListRef | null>;
    readonly rows: readonly IconSelectorRowInterface[];
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
    readonly emptyState: ReactElement;
}

const ESTIMATED_ROW_HEIGHT = 66;
const CONTENT_GAP = 8;
const keyExtractor = (row: IconSelectorRowInterface) => row.key;
const getItemType = (row: IconSelectorRowInterface) => row.kind;

export const IconSelectorList = ({ listRef, rows, selectedIcon, onSelect, emptyState }: Props) => {
    const contentContainerStyle = useFormsheetListContentStyle(0, CONTENT_GAP);

    const stickyHeaderIndices = rows.flatMap((row, index) => (isDefined(row.title) ? [index] : []));
    const stickyHeaderConfig = { offset: 0 };

    const renderItem = ({ item }: { item: IconSelectorRowInterface }) => (
        <IconSelectorRow row={item} selectedIcon={selectedIcon} onSelect={onSelect} />
    );

    const listOptions = {
        getItemType,
        stickyHeaderIndices,
        stickyHeaderConfig,
        estimatedItemSize: ESTIMATED_ROW_HEIGHT,
        contentContainerStyle,
        ListEmptyComponent: emptyState
    };

    return <SelectorList listRef={listRef} data={rows} keyExtractor={keyExtractor} renderItem={renderItem} options={listOptions} />;
};
