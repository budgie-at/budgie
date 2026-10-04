import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { CreateTransactionTrigger } from '../../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const FAB_ANIMATION_DELAY = 75;
const FAB_INITIAL_SCALE = 0.85;
const FAB_SPRING_CONFIG = { damping: 20, stiffness: 400 };

interface Props {
    readonly isMenuOpen: boolean;
    readonly onPress: () => void;
}

export const AccountFab = ({ isMenuOpen, onPress }: Props) => {
    const scale = useSharedValue(FAB_INITIAL_SCALE);

    useEffect(() => {
        scale.value = withDelay(FAB_ANIMATION_DELAY, withSpring(1, FAB_SPRING_CONFIG));
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <View className="absolute right-0 bottom-0 px-lg pb-safe" pointerEvents="box-none">
            <Animated.View style={animatedStyle}>
                <CreateTransactionTrigger isOpen={isMenuOpen} onPress={onPress} />
            </Animated.View>
        </View>
    );
};
