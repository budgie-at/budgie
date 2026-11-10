import { BudgetPeriodEnum } from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetStartsOnRow } from '../budget-starts-on-row/budget-starts-on-row';

export const BudgetAnchorDateStartField = () => {
    const today = useToday();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const { control, setValue } = useFormContext<BudgetFormValues>();
    const openDatePicker = useOpenModal('/date-picker');
    const [period, periodAnchorMs] = useWatch({ control, name: ['period', 'periodAnchorMs'] });
    const anchorDate = isDefined(periodAnchorMs) ? new Date(periodAnchorMs) : startOfDay(today);
    const value = period === BudgetPeriodEnum.YEARLY ? formatMonthAndDay(anchorDate) : formatDayAndMonthAndYear(anchorDate);

    const handlePress = () => {
        openDatePicker({ initialDate: anchorDate }, selectedDate => {
            if (isDefined(selectedDate)) {
                setValue('periodAnchorMs', startOfDay(selectedDate).getTime(), { shouldDirty: true });
            }
        });
    };

    return <BudgetStartsOnRow value={value} onPress={handlePress} />;
};
