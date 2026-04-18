import { useLingui } from '@lingui/react/macro';
import * as Haptics from 'expo-haptics';
import { ReactNode, useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { AI_SUBSYSTEM_CARD_VISUALS } from '../../constant/ai-subsystem-card-visuals.constant';
import { AiSubsystemCardStateEnum } from '../../enum/ai-subsystem-card-state.enum';
import { useLongPressHold } from '../../hook/use-long-press-hold.hook';
import { AiSubsystemStatusSnapshotInterface } from '../../interface/ai-subsystem-status-snapshot.interface';
import { aiLog } from '../../utils/ai-log.util';

interface Props {
    readonly snapshot: AiSubsystemStatusSnapshotInterface;
    readonly title: ReactNode;
    readonly renderLeftIcon: (holdProgress: SharedValue<number>, colorClass: string) => ReactNode;
    readonly rebuildAlertTitle: string;
    readonly rebuildAlertMessage: string;
    readonly rebuildLogKey: string;
    readonly onRebuild: () => Promise<void>;
}

export const AiSubsystemStatusCardLayout = (props: Props) => {
    const { snapshot, title, renderLeftIcon, rebuildAlertTitle, rebuildAlertMessage, rebuildLogKey, onRebuild } = props;
    const { t } = useLingui();
    const [isRebuilding, setIsRebuilding] = useState(false);

    const isHidden = snapshot.state === AiSubsystemCardStateEnum.Hidden;

    const handleRebuildConfirm = async (): Promise<void> => {
        setIsRebuilding(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await onRebuild();
        } catch (error: unknown) {
            aiLog(rebuildLogKey, { errorMessage: getErrorMessage(error) });
        } finally {
            setIsRebuilding(false);
        }
    };

    const handleLongPressComplete = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(rebuildAlertTitle, rebuildAlertMessage, [
            { text: t`Cancel`, style: 'cancel' },
            { text: t`Rebuild`, style: 'destructive', onPress: () => void handleRebuildConfirm() }
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
    const rightContent = <Text className={`text-sm font-medium ${visuals.colorClass}`}>{`${snapshot.percent}%`}</Text>;

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={scaleStyle}>
                <HorizontalCell left={leftContent} right={rightContent} variant="secondary" contentClassName="gap-y-xs">
                    <Text className="text-sm font-medium text-primary">{title}</Text>
                    <Text className="text-xs font-medium text-secondary-foreground">{snapshot.statusText}</Text>
                    <AiProgressBar progress={snapshot.percent} />
                </HorizontalCell>
            </Animated.View>
        </Pressable>
    );
};
