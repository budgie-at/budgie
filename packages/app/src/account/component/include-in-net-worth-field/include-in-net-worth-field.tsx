import { useLingui } from '@lingui/react/macro';
import { Control, Controller, Path, UseControllerReturn } from 'react-hook-form';
import { Text } from 'react-native';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props<T extends { includeInNetWorth?: boolean }> {
    readonly control: Control<T>;
}

export const IncludeInNetWorthField = <T extends { includeInNetWorth?: boolean }>({ control }: Props<T>) => {
    const { t } = useLingui();

    const render = ({ field: { value, onChange } }: UseControllerReturn<T, Path<T>>) => {
        const handlePress = () => void onChange(!value);

        return (
            <HorizontalCell
                testID={AccountFormSelectors.IncludeInNetWorthRow}
                right={
                    <ThemedSwitch
                        className="my-auto"
                        value={value}
                        onValueChange={onChange}
                        testID={AccountFormSelectors.IncludeInNetWorthSwitch}
                    />
                }
            >
                <HapticPressable
                    className="flex-1"
                    onPress={handlePress}
                    testID={AccountFormSelectors.IncludeInNetWorthTitle}
                >
                    <Text className="text-sm font-medium text-primary">{t`Include in Net Worth`}</Text>
                    <Text className="text-sm font-medium text-secondary-foreground">
                        {t`Count this account in your net worth calculation`}
                    </Text>
                </HapticPressable>
            </HorizontalCell>
        );
    };

    return <Controller control={control} name={'includeInNetWorth' as Path<T>} render={render} />;
};
