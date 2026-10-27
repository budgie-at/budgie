import { Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly amount: string;
    readonly onPress?: () => void;
}

const ANIMATION_DELAY = 50;
const ANIMATION_DURATION = 200;
const ENTERING_ANIMATION = FadeInDown.delay(ANIMATION_DELAY).duration(ANIMATION_DURATION);

export const TransactionSecondaryAmount = ({ amount, onPress }: Props) => (
    <Pressable onPress={onPress} disabled={!isDefined(onPress)}>
        <Animated.Text entering={ENTERING_ANIMATION} className="text-lg text-secondary-foreground font-medium mt-xs">
            {amount}
        </Animated.Text>
    </Pressable>
);
