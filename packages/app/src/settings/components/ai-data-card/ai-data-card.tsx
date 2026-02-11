import { useLingui } from '@lingui/react/macro';
import { useCallback } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { LongPressBrain } from '../../../ai/component/long-press-brain/long-press-brain';
import { useLongPressHold } from '../../../ai/hook/use-long-press-hold.hook';
import { useAiDataPreparation } from '../../hook/use-ai-data-preparation.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

const ICON_CONTAINER_SIZE = 36;
const ICON_SIZE = 20;
const FULL_PROGRESS = 100;

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const AiDataCard = () => {
    const { t } = useLingui();
    const {
        start,
        startFresh,
        isRunning,
        progress,
        phaseLabel,
        embeddedCount,
        totalContexts,
        isLlmReady,
        isLlmInitializing,
        llmDownloadProgress
    } = useAiDataPreparation();

    const handlePress = useCallback(() => void start(), [start]);
    const handleLongPressComplete = useCallback(() => void startFresh(), [startFresh]);

    const { holdProgress, pressScale, handlePressIn, handlePressOut } = useLongPressHold({
        onPress: handlePress,
        onLongPressComplete: handleLongPressComplete,
        disabled: isRunning
    });

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.get() }]
    }));

    const completionRatio = isPositiveNumber(totalContexts) ? Math.round((embeddedCount / totalContexts) * FULL_PROGRESS) : 0;
    const downloadPercent = Math.round(llmDownloadProgress * FULL_PROGRESS);
    let idleSubtitle = t`Downloading AI model...`;
    let idleProgress = downloadPercent;
    if (isLlmReady) {
        idleSubtitle = t`${embeddedCount} of ${totalContexts} contexts embedded`;
        idleProgress = completionRatio;
    } else if (isLlmInitializing) {
        idleSubtitle = t`Initializing AI model...`;
        idleProgress = downloadPercent;
    }
    const brainProgress = isRunning ? progress : idleProgress;
    const subtitle = isRunning ? phaseLabel : idleSubtitle;

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <HorizontalCell
                    left={
                        <LongPressBrain
                            progress={brainProgress}
                            size={ICON_CONTAINER_SIZE}
                            iconSize={ICON_SIZE}
                            isAnimating={isRunning}
                            holdProgress={holdProgress}
                        />
                    }
                    right={<Text className="text-sm font-medium text-secondary-foreground">{`${brainProgress}%`}</Text>}
                    variant="secondary"
                    contentClassName="gap-y-xs"
                >
                    <Text className="text-sm font-medium text-primary">{t`Prepare AI Data`}</Text>
                    <Text className="text-xs font-medium text-secondary-foreground">{subtitle}</Text>
                    <AiProgressBar progress={brainProgress} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
