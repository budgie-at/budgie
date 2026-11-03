import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { IconSelectorTileRow } from '../icon-selector-tile-row/icon-selector-tile-row';

import type { IconSelectorRowInterface } from '../../interface/icon-selector-row.interface';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly row: IconSelectorRowInterface;
    readonly selectedIcon: UserIconType | undefined;
    readonly onSelect: (icon: UserIconType) => void;
}

export const IconSelectorRow = ({ row, selectedIcon, onSelect }: Props) => {
    if (isDefined(row.title)) {
        return (
            <View className="justify-end bg-surface pt-2xl pb-md">
                <Text className="text-secondary-foreground text-[15px] font-semibold" accessibilityRole="header">
                    {row.title}
                </Text>
            </View>
        );
    }

    return <IconSelectorTileRow entries={row.entries} selectedIcon={selectedIcon} onSelect={onSelect} />;
};
