import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

const ICON_SIZE = 32;
const APPEAR_DELAY = 300;
const INITIAL_ROTATION = -180;
const BOTTOM_OFFSET = 100;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.8 };

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingRight: 16
    }
});

export const AccountDetailsFab = () => {
    const { bottom } = useSafeAreaInsets();
    const { isMenuOpen, openMenu } = useCreateActionContext();
    const [, hapticImpact] = useVibration();

    const scale = useSharedValue(0);
    const rotation = useSharedValue(INITIAL_ROTATION);

    useEffect(() => {
        scale.value = withDelay(APPEAR_DELAY, withSpring(1, SPRING_CONFIG));
        rotation.value = withDelay(APPEAR_DELAY, withSpring(0, SPRING_CONFIG));
    }, [rotation, scale]);

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        openMenu();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }]
    }));

    const containerStyle = useMemo(() => [styles.container, { paddingBottom: bottom + BOTTOM_OFFSET }], [bottom]);

    return (
        <View style={containerStyle} pointerEvents="box-none">
            <Animated.View style={animatedStyle}>
                <HapticPressable
                    className="bg-primary rounded-full items-center justify-center w-18 h-18 shadow-lg"
                    {...(!isMenuOpen && { onPress: handlePress })}
                >
                    <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={ICON_SIZE} />
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
