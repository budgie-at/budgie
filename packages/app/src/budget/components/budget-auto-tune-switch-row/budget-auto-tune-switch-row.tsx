import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly value: boolean;
    readonly onValueChange: (value: boolean) => void;
    readonly testID: string;
}

export const BudgetAutoTuneSwitchRow = ({ value, onValueChange, testID }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-row items-center justify-between gap-x-xl">
            <View className="flex-1 gap-y-xs">
                <Text className="text-md font-medium text-primary">{t`Tune limits automatically`}</Text>
                <Text className="text-xs text-secondary-foreground">
                    {t`Adjusts category limits after 3 periods of steady over or under spending`}
                </Text>
            </View>
            <ThemedSwitch testID={testID} value={value} onValueChange={onValueChange} />
        </View>
    );
};
