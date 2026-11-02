import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const SelectorCreatePill = ({ label, onPress, testID }: Props) => (
    <HapticPressable
        onPress={onPress}
        testID={testID}
        className="mt-md h-[44px] flex-row items-center gap-x-sm rounded-full bg-surface-disc px-2xl active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={label}
    >
        <Icon icon={UserIconNameEnum.Plus} size={16} className="text-primary" />
        <Text className="text-primary text-[15px] font-semibold" numberOfLines={1}>
            {label}
        </Text>
    </HapticPressable>
);
