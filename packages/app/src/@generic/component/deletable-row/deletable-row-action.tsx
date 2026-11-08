import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { View } from 'react-native';
import Reanimated, { SharedValue, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { useVibration } from '../../hook/use-vibration.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import { DeletableRowSelector } from './deletable-row.selector';

import type { DeletableRowVariant } from '../../type/deletable-row-variant.type';

const REVEAL_THRESHOLD = -70;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

interface Props {
    readonly drag: SharedValue<number>;
    readonly translation: SharedValue<number>;
    readonly isOpen: boolean;
    readonly label: string;
    readonly variant: DeletableRowVariant;
    readonly onPress: () => void;
}

const pressableVariants = cva('h-full w-[70px]', { variants: { variant: { pill: 'py-xxs pl-sm', fill: '' } } });

const fillVariants = cva('flex-1 items-center justify-center bg-destructive-action active:opacity-80', {
    variants: { variant: { pill: 'rounded-2xl', fill: '' } }
});

export const DeletableRowAction = ({ drag, translation, isOpen, label, variant, onPress }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleRevealed = () => void hapticImpact(ImpactFeedbackStyle.Rigid);

    useAnimatedReaction(
        () => drag.get() <= REVEAL_THRESHOLD,
        (isRevealed, wasRevealed) => {
            if (isRevealed && wasRevealed === false) {
                scheduleOnRN(handleRevealed);
            }
        }
    );

    useAnimatedReaction(
        () => drag.value,
        value => {
            translation.set(value);
        }
    );

    const styleAnimation = useAnimatedStyle(() => ({
        transform: [{ translateX: drag.value + 70 }]
    }));

    const containerStyle = isOpen ? null : styleAnimation;
    const accessibilityVisibility = isOpen ? 'auto' : 'no-hide-descendants';

    return (
        <Reanimated.View style={containerStyle} accessibilityElementsHidden={!isOpen} importantForAccessibility={accessibilityVisibility}>
            <HapticPressable
                testID={DeletableRowSelector.DeleteButton}
                onPress={onPress}
                pressFeedback={HapticPressFeedbackEnum.DESTRUCTIVE}
                accessibilityRole="button"
                accessibilityLabel={label}
                className={pressableVariants({ variant })}
            >
                <View className={fillVariants({ variant })} style={CONTINUOUS_CORNERS}>
                    <Icon className="text-white" icon={UserIconNameEnum.Trash2} />
                </View>
            </HapticPressable>
        </Reanimated.View>
    );
};
