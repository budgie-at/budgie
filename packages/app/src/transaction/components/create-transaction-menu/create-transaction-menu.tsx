import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { CreateActionInterface } from '../../../@generic/interface/create-action.interface';
import { ActionItem } from '../action-item/action-item';
import { AiButton } from '../ai-button/ai-button';

const BACKDROP_OPACITY = 0.85;
const ANIMATION_DURATION = 200;
const TRIGGER_ICON_SIZE = 32;
const BUTTON_ROTATION_ACTIVE = 45;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly accountId?: number;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const CreateTransactionMenu = ({ isOpen, onClose, accountId }: Props) => {
    const { t } = useLingui();
    const [, hapticImpact] = useVibration();
    const { bottom } = useSafeAreaInsets();
    const { createAction } = useCreateActionContext();

    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    const handleClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleCreateExpense = () => {
        onClose();
        router.push({ pathname: '/create-transaction/expense', params: { accountId } });
    };

    const handleCreateIncome = () => {
        onClose();
        router.push({ pathname: '/create-transaction/income', params: { accountId } });
    };

    const handleCreateTransfer = () => {
        onClose();
        router.push({ pathname: '/create-transaction/transfer', params: { accountId } });
    };

    const handleCreateAccount = () => {
        onClose();
        router.push('/(main)/create-account');
    };

    const handleAiPress = () => {
        onClose();
        router.push('/(main)/ai');
    };

    const handleCreateAction = () => {
        onClose();
        createAction?.onPress();
    };

    const showAiButton = !isDefined(createAction);

    const actionItems: CreateActionInterface[] = useMemo(() => {
        const defaultItems: CreateActionInterface[] = [
            { icon: UserIconNameEnum.TrendingDown, label: t`Expense`, variant: 'destructive', onPress: handleCreateExpense },
            { icon: UserIconNameEnum.TrendingUp, label: t`Income`, variant: 'positive', onPress: handleCreateIncome },
            { icon: UserIconNameEnum.ArrowLeftRight, label: t`Transfer`, variant: 'warning', onPress: handleCreateTransfer },
            { icon: UserIconNameEnum.Wallet, label: t`Account`, variant: 'secondary', onPress: handleCreateAccount }
        ];

        if (isDefined(createAction)) {
            return [{ ...createAction, onPress: handleCreateAction }, ...defaultItems];
        }

        return defaultItems;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createAction, t]);

    useEffect(() => {
        opacity.value = withTiming(isOpen ? BACKDROP_OPACITY : 0, { duration: ANIMATION_DURATION });
        rotation.value = withSpring(isOpen ? BUTTON_ROTATION_ACTIVE : 0, SPRING_CONFIG);
    }, [isOpen, opacity, rotation]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

    const containerStyle = { paddingBottom: bottom };

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

            {showAiButton && (
                <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={containerStyle} pointerEvents="box-none">
                    <AiButton onPress={handleAiPress} />
                </View>
            )}

            <View className="absolute right-0 bottom-0 items-end px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
                <View className="items-end" pointerEvents="box-none">
                    {actionItems.map((item, index) => (
                        <ActionItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            variant={item.variant}
                            index={index}
                            totalItems={actionItems.length}
                            isOpen={isOpen}
                            onPress={item.onPress}
                        />
                    ))}

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
