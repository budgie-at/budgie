import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { usePickDate } from '../../../@generic/hook/use-pick-date.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetStartsOnRow } from '../budget-starts-on-row/budget-starts-on-row';

const MAX_PLAIN_START_DAY = 28;

export const BudgetMonthDayStartField = () => {
    const { t } = useLingui();
    const today = useToday();
    const { control, setValue } = useFormContext<BudgetFormValues>();
    const pickDate = usePickDate();
    const [periodStartDay, useLastDayOfMonth] = useWatch({ control, name: ['periodStartDay', 'useLastDayOfMonth'] });
    const value = useLastDayOfMonth ? t`Last day of each month` : t`Day ${periodStartDay} of each month`;

    const handlePress = () => {
        pickDate(new Date(today.getFullYear(), today.getMonth(), periodStartDay), selectedDate => {
            const dayOfMonth = selectedDate.getDate();
            const isLastDay = dayOfMonth > MAX_PLAIN_START_DAY;

            setValue('useLastDayOfMonth', isLastDay, { shouldDirty: true });
            setValue('periodStartDay', isLastDay ? 1 : dayOfMonth, { shouldDirty: true });
        });
    };

    return <BudgetStartsOnRow value={value} onPress={handlePress} />;
};
