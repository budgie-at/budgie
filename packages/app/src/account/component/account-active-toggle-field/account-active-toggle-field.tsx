import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: boolean | undefined;
    readonly onChange: (value: boolean) => void;
}

export const AccountActiveToggleField = ({ value, onChange }: Props) => {
    const { t } = useLingui();

    const handlePress = () => void onChange(!value);

    return (
        <HorizontalCell
            onPress={handlePress}
            testID={CreateAccountScreenSelector.ActiveRow}
            right={
                <ThemedSwitch
                    className="my-auto"
                    onValueChange={onChange}
                    value={value}
                    testID={CreateAccountScreenSelector.ActiveSwitch}
                />
            }
        >
            <Text className="text-sm font-medium text-primary" testID={CreateAccountScreenSelector.ActiveTitle}>
                {t`Active`}
            </Text>
            <Text className="text-sm font-medium text-secondary-foreground">{t`Show this account on the main page`}</Text>
        </HorizontalCell>
    );
};
