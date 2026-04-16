import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../haptic-pressable/haptic-pressable';

interface Props {
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly selectAllTestID?: string;
    readonly deselectAllTestID?: string;
}

export const FilterSheetBulkActions = ({ onSelectAll, onDeselectAll, selectAllTestID, deselectAllTestID }: Props) => (
    <View className="flex-row gap-x-sm">
        <HapticPressable className="rounded-full bg-secondary-background px-lg py-sm" onPress={onSelectAll} testID={selectAllTestID}>
            <Text className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                <Trans>Select All</Trans>
            </Text>
        </HapticPressable>
        <HapticPressable className="rounded-full bg-secondary-background px-lg py-sm" onPress={onDeselectAll} testID={deselectAllTestID}>
            <Text className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                <Trans>Deselect All</Trans>
            </Text>
        </HapticPressable>
    </View>
);
