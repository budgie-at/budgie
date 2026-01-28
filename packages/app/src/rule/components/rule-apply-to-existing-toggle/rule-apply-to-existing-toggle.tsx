import { Trans } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly value: boolean;
    readonly onChange: (value: boolean) => void;
    readonly testID?: string;
}

export const RuleApplyToExistingToggle = ({ value, onChange, testID }: Props) => {
    const handlePress = () => {
        onChange(!value);
    };

    return (
        <Pressable testID={testID} onPress={handlePress} className="flex-row items-center justify-between py-md">
            <Text className="text-base text-primary">
                <Trans>Apply to existing transactions</Trans>
            </Text>
            <ThemedSwitch value={value} onValueChange={onChange} />
        </Pressable>
    );
};
