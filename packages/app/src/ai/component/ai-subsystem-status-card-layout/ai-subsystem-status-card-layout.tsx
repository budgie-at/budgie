import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
import { ReactNode } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useProcessingHaptic } from '../../../@generic/hook/use-processing-haptic.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { AiSubsystemCardStateEnum } from '../../enum/ai-subsystem-card-state.enum';
import { useLongPressHold } from '../../hook/use-long-press-hold.hook';
import { AiSubsystemStatusSnapshotInterface } from '../../interface/ai-subsystem-status-snapshot.interface';

import type { AppServices } from '../../../@generic/runtime/app.runtime';
import type * as Cause from 'effect/Cause';

interface Props {
    readonly snapshot: AiSubsystemStatusSnapshotInterface;
    readonly title: ReactNode;
    readonly renderLeftIcon: (holdProgress: SharedValue<number>, colorClass: string) => ReactNode;
    readonly rebuildAlertTitle: string;
    readonly rebuildAlertMessage: string;
    readonly rebuildLogKey: string;
    readonly onRebuild: Effect.Effect<void, Cause.YieldableError, AppServices>;
}

export const AiSubsystemStatusCardLayout = (props: Props) => {
    const { snapshot, title, renderLeftIcon, rebuildAlertTitle, rebuildAlertMessage, rebuildLogKey, onRebuild } = props;
    const { t } = useLingui();
    const { isLoading: isRebuilding, run } = useSingleFlight();
    const [hapticNotification, hapticImpact] = useVibration();

    useProcessingHaptic(isRebuilding);

    const isHidden = snapshot.state === AiSubsystemCardStateEnum.HIDDEN;

    const handleRebuildConfirm = (): void => {
        hapticImpact(ImpactFeedbackStyle.Heavy);
        void run(
            onRebuild.pipe(
                Effect.tap(() => Effect.sync(() => void hapticNotification(NotificationFeedbackType.Success))),
                Effect.catch(error =>
                    Effect.sync(() => void hapticNotification(NotificationFeedbackType.Error)).pipe(
                        Effect.andThen(Effect.logError(rebuildLogKey, { errorMessage: getErrorMessage(error) }))
                    )
                )
            )
        );
    };

    const handleLongPressComplete = () => {
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

    const leftContent = renderLeftIcon(holdProgress, 'text-secondary-foreground');
    const rightContent = <Text className="text-[17px] text-secondary-foreground">{snapshot.percent}%</Text>;

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <GroupedListRow
                    left={leftContent}
                    title={<Text className="text-[17px] text-primary">{title}</Text>}
                    subtitle={snapshot.statusText}
                    right={rightContent}
                />
            </Animated.View>
        </Pressable>
    );
};
