import { BudgetPeriodEnum } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetAnchorDateStartField } from '../budget-anchor-date-start-field/budget-anchor-date-start-field';
import { BudgetMonthDayStartField } from '../budget-month-day-start-field/budget-month-day-start-field';
import { BudgetWeekdayStartField } from '../budget-weekday-start-field/budget-weekday-start-field';

export const BudgetStartsOnField = () => {
    const { control } = useFormContext<BudgetFormValues>();
    const period = useWatch({ control, name: 'period' });

    if (period === BudgetPeriodEnum.WEEKLY) {
        return <BudgetWeekdayStartField />;
    }

    if (period === BudgetPeriodEnum.MONTHLY) {
        return <BudgetMonthDayStartField />;
    }

    return <BudgetAnchorDateStartField />;
};
