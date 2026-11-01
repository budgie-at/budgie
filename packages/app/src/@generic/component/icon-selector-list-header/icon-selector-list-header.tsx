import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { ICON_SELECTOR_COLUMNS } from '../../constant/icon-selector-columns.constant';
import { padFlatListData } from '../../utils/map-to-flatlist-data.util';
import { IconSelectorCard } from '../icon-selector-card/icon-selector-card';
import { IconSelectorPaddingCell } from '../icon-selector-padding-cell/icon-selector-padding-cell';

import type { IconSearchEntryInterface } from '../../interface/icon-search-entry.interface';
import type { FlatListDataItem } from '../../utils/map-to-flatlist-data.util';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly entries: readonly IconSearchEntryInterface[];
    readonly keywords: readonly string[];
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
}

export const IconSelectorListHeader = ({ entries, keywords, selectedIcon, onSelect }: Props) => {
    const renderTile = (item: FlatListDataItem<IconSearchEntryInterface>, index: number) => {
        const key = item.isEmpty ? `empty-${index}` : item.icon;

        return (
            <View key={key} className="flex-1">
                {item.isEmpty ? (
                    <IconSelectorPaddingCell />
                ) : (
                    <IconSelectorCard isSelected={item.icon === selectedIcon} onSelect={onSelect} label={item.label} icon={item.icon} />
                )}
            </View>
        );
    };

    return (
        <View className="gap-y-md">
            <Text className="text-secondary-foreground px-3xl text-[15px] font-semibold" accessibilityRole="header">
                {isNotEmptyArray(keywords) ? <Trans>Suggested</Trans> : <Trans>Popular</Trans>}
            </Text>
            <View className="flex-row gap-x-md" testID={IconSelectorModalSelector.Suggestions}>
                {padFlatListData([...entries], ICON_SELECTOR_COLUMNS).map(renderTile)}
            </View>
            <Text className="text-secondary-foreground px-3xl pt-3xl text-[15px] font-semibold" accessibilityRole="header">
                <Trans>All icons</Trans>
            </Text>
        </View>
    );
};
