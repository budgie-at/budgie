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
    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'isWidgetEnabled'>) => {
        const stateMarkerTestID = value ? BudgetSelector.SetupWidgetEnabledToggleStateOn : BudgetSelector.SetupWidgetEnabledToggleStateOff;

        return (
            <View className="flex-row items-center gap-x-xs">
                <View testID={stateMarkerTestID} className="h-1 w-1" />
                <ThemedSwitch testID={BudgetSelector.SetupWidgetEnabledToggle} value={value} onValueChange={onChange} />
            </View>
        );
    };

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
