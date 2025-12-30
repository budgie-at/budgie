import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { BottomSheetTextInput } from '../../../@generic/component/bottom-sheet-text-input/bottom-sheet-text-input';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly search: string;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly searchPlaceholder: string;
    readonly onSearchChange: (search: string) => void;
}

export const TransactionFilterControls = ({ onSelectAll, onDeselectAll, searchPlaceholder, search, onSearchChange }: Props) => (
    <View className="gap-y-3xl">
        <BottomSheetTextInput placeholder={searchPlaceholder} value={search} onChangeText={onSearchChange} />

        <View className="flex-row gap-x-md">
            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={onSelectAll}>
                <Text className="text-secondary-foreground text-xs font-medium">
                    <Trans>Select All</Trans>
                </Text>
            </HapticPressable>
            <HapticPressable className="py-md px-xl rounded-3xl bg-secondary-background" onPress={onDeselectAll}>
                <Text className="text-secondary-foreground text-xs font-medium">
                    <Trans>Deselect All</Trans>
                </Text>
            </HapticPressable>
        </View>
    </View>
);
