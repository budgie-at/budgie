import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ActionItem } from '../action-item/action-item';
import { AiButton } from '../ai-button/ai-button';

const BACKDROP_OPACITY = 0.85;
const ANIMATION_DURATION = 200;
const TRIGGER_ICON_SIZE = 32;
const BUTTON_ROTATION_ACTIVE = 45;
const TOTAL_ITEMS = 4;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const CreateTransactionMenu = ({ isOpen, onClose }: Props) => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();
    const { bottom } = useSafeAreaInsets();

    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(isOpen ? BACKDROP_OPACITY : 0, { duration: ANIMATION_DURATION });
        rotation.value = withSpring(isOpen ? BUTTON_ROTATION_ACTIVE : 0, SPRING_CONFIG);
    }, [isOpen, opacity, rotation]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

    const containerStyle = { paddingBottom: bottom };

    const handleClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleCreateExpense = () => {
        onClose();
        router.push('/create-transaction/expense');
    };

    const handleCreateIncome = () => {
        onClose();
        router.push('/create-transaction/income');
    };

    const handleCreateTransfer = () => {
        onClose();
        router.push('/create-transaction/transfer');
    };

    const handleCreateAccount = () => {
        onClose();
        router.push('/(main)/create-account');
    };

    const handleAiPress = () => {
        onClose();
        router.push('/(main)/ai');
    };

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(handleClose)();
    });

    if (!isOpen) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <GestureDetector gesture={tapGesture}>
                <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
            </GestureDetector>

            <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={containerStyle} pointerEvents="box-none">
                <AiButton onPress={handleAiPress} />
            </View>

            <View className="absolute right-0 bottom-0 items-end px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
                <View className="items-end" pointerEvents="box-none">
                    <ActionItem
                        icon={UserIconNameEnum.TrendingDown}
                        label={t`Expense`}
                        variant="destructive"
                        index={0}
                        totalItems={TOTAL_ITEMS}
                        isOpen={isOpen}
                        onPress={handleCreateExpense}
                    />
                    <ActionItem
                        icon={UserIconNameEnum.TrendingUp}
                        label={t`Income`}
                        variant="positive"
                        index={1}
                        totalItems={TOTAL_ITEMS}
                        isOpen={isOpen}
                        onPress={handleCreateIncome}
                    />
                    <ActionItem
                        icon={UserIconNameEnum.ArrowLeftRight}
                        label={t`Transfer`}
                        variant="warning"
                        index={2}
                        totalItems={TOTAL_ITEMS}
                        isOpen={isOpen}
                        onPress={handleCreateTransfer}
                    />
                    <ActionItem
                        icon={UserIconNameEnum.Wallet}
                        label={t`Account`}
                        variant="secondary"
                        index={3}
                        totalItems={TOTAL_ITEMS}
                        isOpen={isOpen}
                        onPress={handleCreateAccount}
                    />

                    <Pressable onPress={handleClose}>
                        <Animated.View className="bg-primary rounded-full items-center justify-center w-18 h-18" style={buttonStyle}>
                            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={TRIGGER_ICON_SIZE} />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};
