import { Trans } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { RuleCreationProgressInterface } from '../../interface/rule-creation-progress.interface';

const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 150;

const entering = FadeIn.duration(FADE_IN_DURATION);
const exiting = FadeOut.duration(FADE_OUT_DURATION);

interface Props {
    readonly count: number | null;
    readonly isLoading: boolean;
    readonly progress: RuleCreationProgressInterface | null;
}

const renderLoadingState = (children: ReactNode) => (
    <Animated.View entering={entering} exiting={exiting} className="flex-row items-center gap-x-sm">
        <ActivityIndicator size="small" />
        <Text className="text-sm text-secondary-foreground">{children}</Text>
    </Animated.View>
);

export const RuleMatchingCount = ({ count, isLoading, progress }: Props) => {
    if (isDefined(progress)) {
        const { processed } = progress;
        const { total } = progress;

        return renderLoadingState(
            <Trans>
                Updating {processed}/{total}...
            </Trans>
        );
    }

    if (isLoading) {
        return renderLoadingState(<Trans>Checking transactions...</Trans>);
    }

    if (!isDefined(count)) {
        return <Animated.View entering={entering} exiting={exiting} />;
    }

    if (count === 0) {
        return (
            <Animated.View entering={entering} exiting={exiting}>
                <Text className="text-sm text-secondary-foreground">
                    <Trans>No matching transactions</Trans>
                </Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View entering={entering} exiting={exiting}>
            <Text className="text-sm text-primary font-medium">
                <Trans>{count} matching transactions</Trans>
            </Text>
            <Text className="text-xs text-secondary-foreground">
                <Trans>Update them too?</Trans>
            </Text>
        </Animated.View>
    );
};
