import { UserIconNameEnum } from '@budgie/contracts';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const SWIPE_ACTIONS_WIDTH = 140;

interface Props {
    readonly drag: SharedValue<number>;
    readonly onEditPress: EmptyFn;
    readonly onDeletePress: EmptyFn;
}

export const BudgetRowSwipeActions = ({ drag, onEditPress, onDeletePress }: Props) => {
    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + SWIPE_ACTIONS_WIDTH }]
    }));

    return (
        <Reanimated.View style={styleAnimation} className="flex-row">
            <HapticPressable onPress={onEditPress} className="justify-center items-center w-17.5 h-full bg-secondary-background">
                <Icon className="text-primary" icon={UserIconNameEnum.Pencil} />
            </HapticPressable>
            <HapticPressable onPress={onDeletePress} className="justify-center items-center w-17.5 h-full">
                <Icon className="text-primary" icon={UserIconNameEnum.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
