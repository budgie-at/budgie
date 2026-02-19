import { useLingui } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { LongPressBrain } from '../../../ai/component/long-press-brain/long-press-brain';
import { useAiStatusContext } from '../../../ai/context/ai-status.context';
import { useLongPressHold } from '../../../ai/hook/use-long-press-hold.hook';
import { AiProgressBar } from '../ai-progress-bar/ai-progress-bar';

const ICON_CONTAINER_SIZE = 36;
const ICON_SIZE = 20;

export const AiDataCard = () => {
    const { t } = useLingui();
    const { statusLabel, brainProgress, isRunning, start, startFresh } = useAiStatusContext();

    const handlePress = () => void start();
    const handleLongPressComplete = () => void startFresh();

    const { holdProgress, pressScale, handlePressIn, handlePressOut } = useLongPressHold({
        onPress: handlePress,
        onLongPressComplete: handleLongPressComplete,
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
                    <Text className="text-xs font-medium text-secondary-foreground">{statusLabel}</Text>
                    <AiProgressBar progress={brainProgress} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
