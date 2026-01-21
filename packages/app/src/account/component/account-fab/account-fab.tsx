import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreateTransactionTrigger } from '../../../transaction/components/create-transaction-trigger/create-transaction-trigger';

const FAB_ANIMATION_DELAY = 150;
const FAB_SPRING_CONFIG = { damping: 18, stiffness: 280 };

interface Props {
    readonly isMenuOpen: boolean;
    readonly onPress: () => void;
}

export const AccountFab = ({ isMenuOpen, onPress }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(FAB_ANIMATION_DELAY, withSpring(1, FAB_SPRING_CONFIG));
    }, [scale]);

    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const containerStyle = { paddingBottom: bottom };

    return (
        <View className="absolute right-0 bottom-0 px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
            <Animated.View style={animatedStyle}>
                <CreateTransactionTrigger isOpen={isMenuOpen} onPress={onPress} />
            </Animated.View>
        </View>
    );
};
