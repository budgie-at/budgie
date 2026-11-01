import { useLingui } from '@lingui/react/macro';
import { addDays } from 'date-fns/addDays';
import { startOfWeek } from 'date-fns/startOfWeek';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { BudgetStartsOnRow } from '../budget-starts-on-row/budget-starts-on-row';
import { BudgetWeekdayMenuItem } from '../budget-weekday-menu-item/budget-weekday-menu-item';

const WEEKDAY_OFFSETS = [0, 1, 2, 3, 4, 5, 6] as const;

export const BudgetWeekdayStartField = () => {
    const { t } = useLingui();
    const today = useToday();
    const { formatWeekday } = useFormatDate();
    const { control, setValue } = useFormContext<BudgetFormValues>();
    const periodAnchorMs = useWatch({ control, name: 'periodAnchorMs' });
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const selectedMs = isDefined(periodAnchorMs) ? periodAnchorMs : weekStart.getTime();
    const selectedWeekday = formatWeekday(new Date(selectedMs));
    const title = t`Starts on`;
    const trigger = <BudgetStartsOnRow value={selectedWeekday} />;

    const handleSelect = (offset: number) => {
        setValue('periodAnchorMs', addDays(weekStart, offset).getTime(), { shouldDirty: true });
    };

    return (
        <ActionsMenu trigger={trigger} accessibilityLabel={`${title}, ${selectedWeekday}`} triggerTestID={BudgetSelector.SetupStartsOnRow}>
            {WEEKDAY_OFFSETS.map(offset => {
                const label = formatWeekday(addDays(weekStart, offset));

                return (
                    <BudgetWeekdayMenuItem
                        key={offset}
                        label={label}
                        offset={offset}
                        isSelected={label === selectedWeekday}
                        onSelect={handleSelect}
                    />
                );
            })}
        </ActionsMenu>
    );
};
