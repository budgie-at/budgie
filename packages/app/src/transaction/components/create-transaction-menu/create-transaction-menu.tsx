import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { useCreateActionContext } from '../../../@generic/context/create-action.context';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { CreateActionInterface } from '../../../@generic/interface/create-action.interface';
import { useVoiceInputContext } from '../../../ai/context/voice-input.context';
import { AiModeEnum } from '../../../ai/enum/ai-mode.enum';
import { useAiProgress } from '../../../ai/hook/use-ai-progress.hook';
import { useAi } from '../../../ai/hook/use-ai.hook';
import { ActionItem } from '../action-item/action-item';
import { AiButton } from '../ai-button/ai-button';

import { CreateTransactionMenuSelector } from './create-transaction-menu.selector';

const CLOSE_ANIMATION_DURATION = 250;
const BUTTON_ROTATION_ACTIVE = 45;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };
const CLOSE_SPRING_CONFIG = { damping: 20, stiffness: 300, mass: 0.5 };

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
    const { mode, stt, llm } = useAi();
    const { downloadProgress } = useAiProgress();
    const isAiAvailable = mode !== AiModeEnum.Disabled;
    const { open: openVoiceInput } = useVoiceInputContext();
    const [isVisible, setIsVisible] = useState(false);

    const LLM_PROGRESS_WEIGHT = 0.97;
    const STT_PROGRESS_WEIGHT = 0.03;

    const isAiLoading = isAiAvailable && (!llm.isReady || !stt.isReady);
    const isAiInitializing = isAiAvailable && llm.isInitializing;
    const aiDownloadProgress = isAiAvailable
        ? downloadProgress * LLM_PROGRESS_WEIGHT + (stt.downloadProgress / 100) * STT_PROGRESS_WEIGHT
        : 0;

    const rotation = useSharedValue(0);
    const menuScale = useSharedValue(0);

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
        openVoiceInput();
    };

    const handleCreateAction = () => {
        onClose();
        createAction?.onPress();
    };

    const showAiButton = isAiAvailable && !isDefined(createAction);

    const defaultItems: (CreateActionInterface & { testID?: string })[] = [
        {
            icon: UserIconNameEnum.TrendingDown,
            label: t`Expense`,
            testID: CreateTransactionMenuSelector.Expense,
            variant: 'destructive',
            onPress: handleCreateExpense
        },
        {
            icon: UserIconNameEnum.TrendingUp,
            label: t`Income`,
            testID: CreateTransactionMenuSelector.Income,
            variant: 'positive',
            onPress: handleCreateIncome
        },
        {
            icon: UserIconNameEnum.ArrowLeftRight,
            label: t`Transfer`,
            testID: CreateTransactionMenuSelector.Transfer,
            variant: 'warning',
            onPress: handleCreateTransfer
        },
        {
            icon: UserIconNameEnum.Wallet,
            label: t`Account`,
            testID: CreateTransactionMenuSelector.AddAccount,
            variant: 'secondary',
            onPress: handleCreateAccount
        }
    ];

    const actionItems: (CreateActionInterface & { testID?: string })[] = isDefined(createAction)
        ? [{ ...createAction, onPress: handleCreateAction }, ...defaultItems]
        : defaultItems;

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation mount/unmount pattern: visibility deferred until close animation completes
            setIsVisible(true);
            rotation.value = withSpring(BUTTON_ROTATION_ACTIVE, SPRING_CONFIG);
            menuScale.value = withSpring(1, SPRING_CONFIG);
        } else if (isVisible) {
            rotation.value = withSpring(0, CLOSE_SPRING_CONFIG);
            menuScale.value = withTiming(0, { duration: CLOSE_ANIMATION_DURATION }, finished => {
                if (finished) {
                    runOnJS(setIsVisible)(false);
                }
            });
        }
    }, [isOpen, isVisible, menuScale, rotation]);
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
    const aiButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: menuScale.value }],
        opacity: menuScale.value,
        paddingBottom: bottom
    }));

    const containerStyle = { paddingBottom: bottom };

    if (!isVisible) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {showAiButton && (
                <Animated.View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={aiButtonStyle} pointerEvents="box-none">
                    <AiButton
                        onPress={handleAiPress}
                        isAnimating={false}
                        isLoading={isAiLoading}
                        isInitializing={isAiInitializing}
                        downloadProgress={aiDownloadProgress}
                    />
                </Animated.View>
            )}

            <View className="absolute right-0 bottom-0 items-end px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
                <View className="items-end" pointerEvents="box-none">
                    {actionItems.map((item, index) => (
                        <ActionItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            testID={item.testID}
                            variant={item.variant}
                            index={index}
                            totalItems={actionItems.length}
                            isOpen={isOpen}
                            onPress={item.onPress}
                        />
                    ))}

                    <CircularActionButton icon={UserIconNameEnum.Plus} onPress={handleClose} animatedStyle={buttonStyle} />
                </View>
            </View>
        </View>
    );
};
