import { Trans, useLingui } from '@lingui/react/macro';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { getErrorMessage } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AI_SYSTEM_STATE_VISUALS } from '../../constant/ai-system-state-visuals.constant';
import { AiSystemActionEnum } from '../../enum/ai-system-action.enum';
import { useAiSystemStatus } from '../../hook/use-ai-system-status.hook';
import { useLongPressHold } from '../../hook/use-long-press-hold.hook';
import { aiSystemStatusService } from '../../service/ai-system-status.service';
import { aiLog } from '../../utils/ai-log.util';
import { AiSystemActionButton } from '../ai-system-action-button/ai-system-action-button';
import { AiSystemBrain } from '../ai-system-brain/ai-system-brain';

const BRAIN_SIZE = 36;
const BRAIN_ICON_SIZE = 20;
const STRIP_WIDTH = 3;

// eslint-disable-next-line max-statements -- Card orchestrates tap / long-press / rebuild / hint flows
export const AiSystemStatusCard = () => {
    const snapshot = useAiSystemStatus();
    const { t } = useLingui();
    const visuals = AI_SYSTEM_STATE_VISUALS[snapshot.state];
    const readyHintShownRef = useRef(false);
    const [isRebuilding, setIsRebuilding] = useState(false);

    const handleRebuildConfirm = async (): Promise<void> => {
        setIsRebuilding(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await aiSystemStatusService.freshRebuild();
        } catch (error: unknown) {
            aiLog('system:action:rebuild:user-throw', { errorMessage: getErrorMessage(error) });
        } finally {
            setIsRebuilding(false);
        }
    };

    const triggerRebuild = () => {
        Alert.alert(t`Rebuild AI data`, t`This reprocesses every transaction, category, and tag. Continue?`, [
            { text: t`Cancel`, style: 'cancel' },
            { text: t`Rebuild`, style: 'destructive', onPress: () => void handleRebuildConfirm() }
        ]);
    };

    const handleLongPressComplete = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        triggerRebuild();
    };

    const handleAction = async (): Promise<void> => {
        if (snapshot.action === AiSystemActionEnum.Boost) {
            await aiSystemStatusService.boost();
        } else if (snapshot.action === AiSystemActionEnum.Cancel) {
            aiSystemStatusService.cancelBoost();
        } else if (snapshot.action === AiSystemActionEnum.Retry) {
            await aiSystemStatusService.retry();
        } else if (!readyHintShownRef.current) {
            readyHintShownRef.current = true;
            Alert.alert(t`Tip`, t`Long-press to rebuild AI data.`);
        }
    };

    const dispatchAction = () => void handleAction();

    const { holdProgress, pressScale, handlePressIn, handlePressOut } = useLongPressHold({
        onPress: dispatchAction,
        onLongPressComplete: handleLongPressComplete,
        disabled: isRebuilding
    });

    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));

    const stripStyle = { width: STRIP_WIDTH };
    const leftContent = (
        <View className="flex-row items-center gap-x-md">
            <View className={visuals.stripClass} style={stripStyle} />
            <AiSystemBrain
                state={snapshot.state}
                percent={snapshot.percent}
                holdProgress={holdProgress}
                size={BRAIN_SIZE}
                iconSize={BRAIN_ICON_SIZE}
            />
        </View>
    );

    const rightContent = (
        <View className="flex-row items-center gap-x-md">
            <Text className={`text-sm font-medium ${visuals.colorClass}`}>{`${snapshot.percent}%`}</Text>
            <AiSystemActionButton action={snapshot.action} onPress={dispatchAction} />
        </View>
    );

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <HorizontalCell left={leftContent} right={rightContent} variant="secondary" contentClassName="gap-y-xs">
                    <Text className="text-sm font-medium text-primary">
                        <Trans>AI System</Trans>
                    </Text>
                    <Text className="text-xs font-medium text-secondary-foreground">{snapshot.statusText}</Text>
                    <AiProgressBar progress={snapshot.percent} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
