import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { useDateFilterModal } from '../../../@generic/context/date-filter-modal.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';

export const BudgetEventDatesField = () => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();
    const { control, setValue } = useFormContext<BudgetEventFormValues>();
    const [openDateFilter] = useDateFilterModal();
    const [startsAtMs, endsAtMs] = useWatch({ control, name: ['startsAtMs', 'endsAtMs'] });
    const startLabel = formatMonthAndDay(new Date(startsAtMs));
    const endLabel = formatDayAndMonthAndYear(new Date(endsAtMs));
    const datesLabel = `${startLabel} – ${endLabel}`;

    const handleOpen = () => {
        openDateFilter({ value: { from: new Date(startsAtMs), to: new Date(endsAtMs) } }, result => {
            const range = result?.value;

            if (isDefined(range) && isDefined(range.from) && isDefined(range.to)) {
                setValue('startsAtMs', range.from.getTime(), { shouldDirty: true, shouldValidate: true });
                setValue('endsAtMs', range.to.getTime(), { shouldDirty: true, shouldValidate: true });
            }
        });
    };

    return (
        <GroupedListValueRow
            icon={UserIconNameEnum.CalendarRange}
            title={t`Dates`}
            value={datesLabel}
            testID={BudgetSelector.EventDatesField}
            onPress={handleOpen}
        />
    );
};
