import { Trans } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetWidgetEnabledField = ({ control }: Props) => {
    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'isWidgetEnabled'>) => (
        <ThemedSwitch testID={BudgetSelector.SetupWidgetEnabledToggle} value={value} onValueChange={onChange} />
    );

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <View className="flex-1">
                <Text className="text-primary font-medium text-md">
                    <Trans>Show widget on home</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Display this budget on the home screen</Trans>
                </Text>
            </View>

            <Controller control={control} name="isWidgetEnabled" render={render} />
        </View>
    );
};
