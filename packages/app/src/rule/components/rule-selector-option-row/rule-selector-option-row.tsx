import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

const CHECK_ICON_SIZE = 16;

interface Props {
    readonly value: string;
    readonly label: string;
    readonly isSelected: boolean;
    readonly onPress: (value: string) => void;
    readonly testID?: string;
}

export const RuleSelectorOptionRow = ({ value, label, isSelected, onPress, testID }: Props) => {
    const handlePress = () => void onPress(value);
    const stateClassName = isSelected ? 'bg-secondary-background border-secondary-corner' : 'border-secondary-corner/50';

    return (
        <HapticPressable
            onPress={handlePress}
            className={cn('rounded-3xl p-3xl border-2 flex-row items-center gap-x-xl', stateClassName)}
            testID={testID}
        >
            <Text className="text-primary text-md font-semibold flex-1">{label}</Text>
            {isSelected ? (
                <View className="bg-primary rounded-full p-xs">
                    <Icon className="text-primary-reverse" icon={UserIconNameEnum.Check} size={CHECK_ICON_SIZE} />
                </View>
            ) : null}
        </HapticPressable>
    );
};
