import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useToday } from '../../../@generic/hook/use-today.hook';
import { useDatePickerModal } from '../../../transaction/context/date-picker-modal.context';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetStartsOnRow } from '../budget-starts-on-row/budget-starts-on-row';

const MAX_PLAIN_START_DAY = 28;

export const BudgetMonthDayStartField = () => {
    const { t } = useLingui();
    const today = useToday();
    const { control, setValue } = useFormContext<BudgetFormValues>();
    const [openDatePicker] = useDatePickerModal();
    const [periodStartDay, useLastDayOfMonth] = useWatch({ control, name: ['periodStartDay', 'useLastDayOfMonth'] });
    const value = useLastDayOfMonth ? t`Last day of each month` : t`Day ${periodStartDay} of each month`;

    const handlePress = () => {
        openDatePicker({ initialDate: new Date(today.getFullYear(), today.getMonth(), periodStartDay) }, selectedDate => {
            if (!isDefined(selectedDate)) {
                return;
            }

            const dayOfMonth = selectedDate.getDate();
            const isLastDay = dayOfMonth > MAX_PLAIN_START_DAY;

            setValue('useLastDayOfMonth', isLastDay, { shouldDirty: true });
            setValue('periodStartDay', isLastDay ? 1 : dayOfMonth, { shouldDirty: true });
        });
    };

    return <BudgetStartsOnRow value={value} onPress={handlePress} />;
};
