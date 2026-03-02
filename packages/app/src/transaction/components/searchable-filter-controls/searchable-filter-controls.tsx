import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Input } from '../../../@generic/component/input/input';

interface Props {
    readonly search: string;
    readonly onSearchChange: (text: string) => void;
    readonly placeholder: string;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
    readonly isVisible: boolean;
}

export const SearchableFilterControls = ({ search, onSearchChange, placeholder, onSelectAll, onDeselectAll, isVisible }: Props) => {
    if (!isVisible) {
        return null;
    }

    return (
        <View className="gap-y-3xl">
            <Input placeholder={placeholder} value={search} onChangeText={onSearchChange} />

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
};
