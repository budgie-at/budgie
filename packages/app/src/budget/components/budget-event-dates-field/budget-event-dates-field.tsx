import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useDateFilterModal } from '../../../@generic/context/date-filter-modal.context';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { RuleSelectorButton } from '../../../rule/components/rule-selector-button/rule-selector-button';
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
        <FormItem label={t`Dates`}>
            <RuleSelectorButton testID={BudgetSelector.EventDatesField} value={datesLabel} onPress={handleOpen} />
        </FormItem>
    );
};
