import { UserIconNameEnum } from '@budgie/contracts';
import { View } from 'react-native';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import { DeletableRowSelector } from './deletable-row.selector';

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

interface Props {
    readonly drag: SharedValue<number>;
    readonly isOpen: boolean;
    readonly label: string;
    readonly onPress: () => void;
}

export const DeletableRowAction = ({ drag, isOpen, label, onPress }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    const containerStyle = isOpen ? null : styleAnimation;

    return (
        <Reanimated.View style={containerStyle}>
            <HapticPressable
                testID={DeletableRowSelector.DeleteButton}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={label}
                className="h-full w-[70px] py-xxs pl-sm"
            >
                <View
                    className="flex-1 items-center justify-center rounded-2xl bg-destructive-fill active:opacity-80"
                    style={CONTINUOUS_CORNERS}
                >
                    <Icon className="text-white" icon={UserIconNameEnum.Trash} />
                </View>
            </HapticPressable>
        </Reanimated.View>
    );
};
