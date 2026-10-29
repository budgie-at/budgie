import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly isAllIn: boolean;
    readonly onToggle: () => void;
}

export const RunwayAllInToggle = ({ isAllIn, onToggle }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-center gap-x-xl">
            <View className="flex-1 gap-y-xxs">
                <Text className="text-sm font-medium text-primary">
                    <Trans>Include one-offs</Trans>
                </Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Spreads irregular costs like insurance across the months.</Trans>
                </Text>
            </View>

            <ThemedSwitch accessibilityLabel={t`Include one-offs`} value={isAllIn} onValueChange={onToggle} />
        </View>
    );
};
