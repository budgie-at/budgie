import { BudgetPeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

interface Props {
    readonly onPeriodChange: (period: BudgetPeriodEnum) => void;
}

export const BudgetPeriodField = ({ onPeriodChange }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const options = [
        { value: BudgetPeriodEnum.WEEKLY, label: t`Week` },
        { value: BudgetPeriodEnum.BIWEEKLY, label: t`Two weeks` },
        { value: BudgetPeriodEnum.MONTHLY, label: t`Month` },
        { value: BudgetPeriodEnum.YEARLY, label: t`Year` }
    ];

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'period'>) => {
        const handleChange = (period: BudgetPeriodEnum) => {
            onChange(period);
            onPeriodChange(period);
        };

        return (
            <FormItem label={t`Period`}>
                <View collapsable={false} testID={BudgetSelector.SetupPeriodTabs}>
                    <SegmentedTabs options={options} value={value} onChange={handleChange} />
                </View>
            </FormItem>
        );
    };

    return <Controller control={control} name="period" render={render} />;
};
