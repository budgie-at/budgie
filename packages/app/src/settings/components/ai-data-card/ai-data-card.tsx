import { Trans } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { LongPressBrain } from '../../../ai/component/long-press-brain/long-press-brain';
import { useAiDataPreparation } from '../../../ai/hook/use-ai-data-preparation.hook';
import { useLongPressHold } from '../../../ai/hook/use-long-press-hold.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

const FULL_PROGRESS = 100;

export const AiDataCard = () => {
    const { isRunning, progress, phaseLabel, embeddedCount, totalContexts, start, startFresh } = useAiDataPreparation();

    const completionRatio = isPositiveNumber(totalContexts) ? Math.round((embeddedCount / totalContexts) * FULL_PROGRESS) : 0;
    const brainProgress = isRunning ? progress : completionRatio;
    const statusLabel = isRunning ? phaseLabel : '';

    const { holdProgress, pressScale, handlePressIn, handlePressOut } = useLongPressHold({
        onPress: () => void start(),
        onLongPressComplete: () => void startFresh(),
        disabled: isRunning
    });

    const scaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pressScale.get() }]
    }));

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <HorizontalCell
                    left={
                        <LongPressBrain
                            progress={brainProgress}
                            size={36}
                            iconSize={20}
                            isAnimating={isRunning}
                            holdProgress={holdProgress}
                        />
                    }
                    right={<Text className="text-sm font-medium text-secondary-foreground">{`${brainProgress}%`}</Text>}
                    variant="secondary"
                    contentClassName="gap-y-xs"
                >
                    <Text className="text-sm font-medium text-primary">
                        <Trans>Prepare AI Data</Trans>
                    </Text>
                    <Text className="text-xs font-medium text-secondary-foreground">{statusLabel}</Text>
                    <AiProgressBar progress={brainProgress} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
