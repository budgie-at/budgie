import { View } from 'react-native';

import { ICON_SELECTOR_COLUMNS } from '../../constant/icon-selector-columns.constant';
import { padFlatListData } from '../../utils/map-to-flatlist-data.util';
import { IconSelectorCard } from '../icon-selector-card/icon-selector-card';
import { IconSelectorPaddingCell } from '../icon-selector-padding-cell/icon-selector-padding-cell';

import type { IconSearchEntryInterface } from '../../interface/icon-search-entry.interface';
import type { FlatListDataItem } from '../../utils/map-to-flatlist-data.util';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly entries: readonly IconSearchEntryInterface[];
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
}

export const IconSelectorTileRow = ({ entries, selectedIcon, onSelect }: Props) => {
    const renderTile = (item: FlatListDataItem<IconSearchEntryInterface>, index: number) =>
        item.isEmpty ? (
            <IconSelectorPaddingCell key={`empty-${index}`} />
        ) : (
            <IconSelectorCard
                key={item.icon}
                isSelected={item.icon === selectedIcon}
                onSelect={onSelect}
                label={item.label}
                icon={item.icon}
            />
        );

    return <View className="flex-row gap-x-md pb-md">{padFlatListData([...entries], ICON_SELECTOR_COLUMNS).map(renderTile)}</View>;
};
