import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly count: number | null;
    readonly isLoading: boolean;
}

export const RuleMatchingCount = ({ count, isLoading }: Props) => {
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

    if (!isDefined(count)) {
        return null;
    }

    if (count === 0) {
        return (
            <Text className="text-sm text-secondary-foreground">
                <Trans>No matching transactions</Trans>
            </Text>
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
