import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly value: string;
    readonly onPress: EmptyFn;
}

export const RuleSelectorField = ({ label, value, onPress }: Props) => (
    <View>
        <Text className="text-secondary-foreground text-xs mb-xs">{label}</Text>
        <HapticPressable onPress={onPress} className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner">
            <Text className="text-primary text-sm">{value}</Text>
        </HapticPressable>
    </View>
);
