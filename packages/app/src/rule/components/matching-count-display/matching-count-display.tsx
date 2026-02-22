import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { RuleCreationProgressInterface } from '../../interface/rule-creation-progress.interface';

interface Props {
    readonly count: number;
    readonly isLoading: boolean;
    readonly progress: RuleCreationProgressInterface | null;
}

export const MatchingCountDisplay = ({ count, isLoading, progress }: Props) => {
    if (isDefined(progress)) {
        const { processed } = progress;
        const { total } = progress;

        return (
            <View className="flex-row items-center gap-x-sm">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-secondary-foreground">
                    <Trans>
                        Updating {processed}/{total}...
                    </Trans>
                </Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View className="flex-row items-center gap-x-sm">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-secondary-foreground">
                    <Trans>Checking transactions...</Trans>
                </Text>
            </View>
        );
    }

    return (
        <>
            <Text className="text-sm text-primary font-medium">
                <Trans>{count} matching transactions</Trans>
            </Text>
            <Text className="text-xs text-secondary-foreground">
                <Trans>Update them too?</Trans>
            </Text>
        </>
    );
};
