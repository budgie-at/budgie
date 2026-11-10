import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { usePickDate } from '../../../@generic/hook/use-pick-date.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';

export const BudgetFundDueField = () => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { control, setValue } = useFormContext<BudgetFundFormValues>();
    const pickDate = usePickDate();
    const dueAtMs = useWatch({ control, name: 'dueAtMs' });
    const dueLabel = formatDayAndMonthAndYear(new Date(dueAtMs));

    const handleOpen = () => {
        pickDate(new Date(dueAtMs), selectedDate => {
            setValue('dueAtMs', selectedDate.getTime(), { shouldDirty: true, shouldValidate: true });
        });
    };

    return (
        <GroupedListValueRow
            icon={UserIconNameEnum.Calendar}
            title={t`Due date`}
            value={dueLabel}
            testID={BudgetSelector.FundDueField}
            onPress={handleOpen}
        />
    );
};
