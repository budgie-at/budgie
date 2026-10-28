import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly name: `categoryLimits.${number}.rolloverMode` | 'otherRolloverMode';
}

export const BudgetRolloverModeField = ({ name }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const options = [
        { value: BudgetRolloverModeEnum.NONE, label: t`Off` },
        { value: BudgetRolloverModeEnum.SURPLUS, label: t`Carry savings` },
        { value: BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT, label: t`Carry all` }
    ];

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, Props['name']>) => (
        <SegmentedTabs options={options} value={value} onChange={onChange} />
    );

    return (
        <View className="gap-y-xs">
            <Text className="text-secondary-foreground text-xs">
                <Trans>Unspent money at period end</Trans>
            </Text>
            <Controller control={control} name={name} render={render} />
        </View>
    );
};
