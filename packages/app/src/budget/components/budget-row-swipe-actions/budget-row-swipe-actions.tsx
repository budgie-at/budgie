import { UserIconNameEnum } from '@budgie/contracts';
import Reanimated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const SWIPE_ACTIONS_WIDTH_SINGLE = 70;
const SWIPE_ACTIONS_WIDTH_DOUBLE = 140;

interface Props {
    readonly drag: SharedValue<number>;
    readonly onDeletePress: EmptyFn;
    readonly onEditPress?: EmptyFn;
}

export const BudgetRowSwipeActions = ({ drag, onDeletePress, onEditPress }: Props) => {
    const width = onEditPress ? SWIPE_ACTIONS_WIDTH_DOUBLE : SWIPE_ACTIONS_WIDTH_SINGLE;

    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + width }]
    }));

    return (
        <Reanimated.View style={styleAnimation} className="flex-row">
            {onEditPress ? (
                <HapticPressable onPress={onEditPress} className="justify-center items-center w-17.5 h-full bg-secondary-background">
                    <Icon className="text-primary" icon={UserIconNameEnum.Pencil} />
                </HapticPressable>
            ) : null}
            <HapticPressable onPress={onDeletePress} className="justify-center items-center w-17.5 h-full">
                <Icon className="text-primary" icon={UserIconNameEnum.Trash} />
            </HapticPressable>
        </Reanimated.View>
    );
};
