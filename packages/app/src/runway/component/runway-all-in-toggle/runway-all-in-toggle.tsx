import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly isAllIn: boolean;
    readonly onToggle: () => void;
}

export const RunwayAllInToggle = ({ isAllIn, onToggle }: Props) => {
    const { t } = useLingui();

    return (
        <Card size="md" className="flex-row items-center gap-x-xl">
            <View className="flex-1 gap-y-xxs">
                <Text className="text-sm font-medium text-primary">
                    <Trans>Include one-offs</Trans>
                </Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Counts irregular costs like insurance or holidays as a monthly expense.</Trans>
                </Text>
            </View>

            <ThemedSwitch accessibilityLabel={t`Include one-offs`} value={isAllIn} onValueChange={onToggle} />
        </Card>
    );
};
