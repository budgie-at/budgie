import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { useIsLargeTextSize } from '../../../@generic/hook/use-is-large-text-size.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetPeriodMenuItem } from '../budget-period-menu-item/budget-period-menu-item';

interface Props {
    readonly onPeriodChange: (period: BudgetPeriodEnum) => void;
}

export const BudgetPeriodField = ({ onPeriodChange }: Props) => {
    const { t } = useLingui();
    const isLargeTextSize = useIsLargeTextSize();
    const { control } = useFormContext<BudgetFormValues>();
    const { field } = useController({ control, name: 'period' });
    const options = [
        { value: BudgetPeriodEnum.WEEKLY, label: t`Week` },
        { value: BudgetPeriodEnum.BIWEEKLY, label: t`Two weeks` },
        { value: BudgetPeriodEnum.MONTHLY, label: t`Month` },
        { value: BudgetPeriodEnum.YEARLY, label: t`Year` }
    ];

    const title = t`Period`;
    const selectedLabel = options.find(option => option.value === field.value)?.label ?? '';
    const trigger = <GroupedListValueRow icon={UserIconNameEnum.Calendar} title={title} value={selectedLabel} />;

    const handleChange = (period: BudgetPeriodEnum) => {
        field.onChange(period);
        onPeriodChange(period);
    };

    if (isLargeTextSize) {
        return (
            <ActionsMenu trigger={trigger} accessibilityLabel={`${title}, ${selectedLabel}`} triggerTestID={BudgetSelector.SetupPeriodTabs}>
                {options.map(option => (
                    <BudgetPeriodMenuItem
                        key={option.value}
                        label={option.label}
                        period={option.value}
                        isSelected={option.value === field.value}
                        onSelect={handleChange}
                    />
                ))}
            </ActionsMenu>
        );
    }

    return (
        <View className="px-3xl py-xl" collapsable={false} testID={BudgetSelector.SetupPeriodTabs}>
            <SegmentedControl segments={options} value={field.value} onChange={handleChange} />
        </View>
    );
};
