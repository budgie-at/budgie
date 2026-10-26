import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { ProgressTrack } from '../../../@generic/component/progress-track/progress-track';
import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

import type { InitialSyncProgressInterface } from '@budgie/sync';

interface Props {
    readonly progress: InitialSyncProgressInterface;
}

export const SyncImportProgress = ({ progress }: Props) => {
    const { t } = useLingui();
    const pulseStyle = useSkeletonPulseStyle();

    const { percent, minutesLeft } = progress;
    const statusText = isDefined(percent) ? t`Importing history · ${percent}%` : t`Importing history…`;
    const etaText = isDefined(minutesLeft)
        ? t({ message: plural(minutesLeft, { one: 'About # minute left', other: 'About # minutes left' }) })
        : null;
    const progressBar = isDefined(percent) ? (
        <ProgressTrack percentage={percent} className="h-[3px]" />
    ) : (
        <View className="h-[3px] overflow-hidden rounded-full bg-secondary-background">
            <Animated.View style={pulseStyle} className="h-full rounded-full bg-secondary-foreground/40" />
        </View>
    );

    return (
        <View
            className="gap-y-sm"
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={statusText}
            {...(isDefined(percent) && { accessibilityValue: { min: 0, max: 100, now: percent } })}
        >
            {progressBar}
            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground">{statusText}</Text>
                {isDefined(etaText) && <Text className="text-xs text-secondary-foreground">{etaText}</Text>}
            </View>
        </View>
    );
};
