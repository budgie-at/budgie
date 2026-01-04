import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly value: boolean;
    readonly onChange: (value: boolean) => void;
}

export const RuleApplyToExistingToggle = ({ value, onChange }: Props) => (
    <View className="flex-row items-center justify-between py-md">
        <Text className="text-base text-primary">
            <Trans>Apply to existing transactions</Trans>
        </Text>
        <ThemedSwitch value={value} onValueChange={onChange} />
    </View>
);
