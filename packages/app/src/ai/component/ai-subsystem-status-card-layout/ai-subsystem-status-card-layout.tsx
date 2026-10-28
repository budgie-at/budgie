import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AI_SUBSYSTEM_CARD_VISUALS } from '../../constant/ai-subsystem-card-visuals.constant';
import { AiSubsystemCardStateEnum } from '../../enum/ai-subsystem-card-state.enum';
import { useLongPressHold } from '../../hook/use-long-press-hold.hook';
import { AiSubsystemStatusSnapshotInterface } from '../../interface/ai-subsystem-status-snapshot.interface';

import type { AppServices } from '../../../@generic/runtime/app.runtime';

interface Props {
    readonly snapshot: AiSubsystemStatusSnapshotInterface;
    readonly title: ReactNode;
    readonly renderLeftIcon: (holdProgress: SharedValue<number>, colorClass: string) => ReactNode;
    readonly rebuildAlertTitle: string;
    readonly rebuildAlertMessage: string;
    readonly rebuildLogKey: string;
    readonly onRebuild: Effect.Effect<void, unknown, AppServices>;
}

export const AiSubsystemStatusCardLayout = (props: Props) => {
    const { snapshot, title, renderLeftIcon, rebuildAlertTitle, rebuildAlertMessage, rebuildLogKey, onRebuild } = props;
    const { t } = useLingui();
    const { isLoading: isRebuilding, run } = useSingleFlight();

    const isHidden = snapshot.state === AiSubsystemCardStateEnum.HIDDEN;

    const handleRebuildConfirm = (): void => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void run(onRebuild.pipe(Effect.catch(error => Effect.logError(rebuildLogKey, { errorMessage: getErrorMessage(error) }))));
    };

    const handleLongPressComplete = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(rebuildAlertTitle, rebuildAlertMessage, [
            { text: t`Cancel`, style: 'cancel' },
            { text: t`Rebuild`, style: 'destructive', onPress: handleRebuildConfirm }
        ]);
    };

    const { holdProgress, pressScale, handlePressIn, handlePressOut } = useLongPressHold({
        onPress: emptyFn,
        onLongPressComplete: handleLongPressComplete,
        disabled: isRebuilding || isHidden
    });

    const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.get() }] }));

    if (isHidden) {
        return null;
    }

    const visuals = AI_SUBSYSTEM_CARD_VISUALS[snapshot.state];

    const leftContent = renderLeftIcon(holdProgress, visuals.colorClass);
    const percentText = `${snapshot.percent}%`;
    const rightContent = <Text className={`text-sm font-medium text-right w-12 ${visuals.colorClass}`}>{percentText}</Text>;

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <HorizontalCell left={leftContent} right={rightContent} contentClassName="gap-y-xs">
                    <Text className="text-sm font-medium text-primary">{title}</Text>
                    <Text className="text-xs font-medium text-secondary-foreground">{snapshot.statusText}</Text>
                    <AiProgressBar progress={snapshot.percent} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
