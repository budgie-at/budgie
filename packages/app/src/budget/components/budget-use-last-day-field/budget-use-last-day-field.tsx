import { Trans } from '@lingui/react/macro';
import { Control, Controller, UseControllerReturn } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly control: Control<BudgetFormValues>;
}

export const BudgetUseLastDayField = ({ control }: Props) => {
    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'useLastDayOfMonth'>) => (
        <ThemedSwitch value={value} onValueChange={onChange} />
    );

    return (
        <View className="flex-row items-center justify-between gap-x-md">
            <View className="flex-1">
                <Text className="text-primary font-medium text-md">
                    <Trans>Use last day of month</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Reset on the last calendar day each month</Trans>
                </Text>
            </View>

            <Controller control={control} name="useLastDayOfMonth" render={render} />
        </View>
    );
};
