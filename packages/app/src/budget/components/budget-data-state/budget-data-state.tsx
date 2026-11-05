import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';

interface Props {
    readonly isLoading: boolean;
    readonly isError?: boolean;
    readonly description?: string;
    readonly title?: string;
}

export const BudgetDataState = ({ isLoading, isError = false, description, title }: Props) => {
    const { t } = useLingui();
    const heading = title ?? (isError ? t`Could not load budget` : t`Budget unavailable`);
    const stateDescription =
        description ??
        (isError
            ? t`Your data could not be loaded. Close this screen and try again.`
            : t`This budget may have been deleted. Go back to see your current budget.`);

    const accessibilityState = { busy: isLoading };

    return (
        <View accessibilityLabel={t`Budget`} accessibilityState={accessibilityState} className="rounded-2xl bg-surface-row p-3xl">
            <LoadingContent isLoading={isLoading}>
                <View className="gap-y-md">
                    <Text accessibilityRole="header" className="text-lg leading-tight font-semibold text-primary">
                        {heading}
                    </Text>
                    {isNotEmptyString(stateDescription) ? (
                        <Text className="text-sm leading-snug text-secondary-foreground">{stateDescription}</Text>
                    ) : null}
                    <Text className="text-xs leading-snug text-secondary-foreground">
                        <Trans>Your transactions are not affected.</Trans>
                    </Text>
                </View>
            </LoadingContent>
        </View>
    );
};
