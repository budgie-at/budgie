import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { RuleSelectorButton } from '../../../rule/components/rule-selector-button/rule-selector-button';
import { useDatePickerModal } from '../../../transaction/context/date-picker-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';

export const BudgetFundDueField = () => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { control, setValue } = useFormContext<BudgetFundFormValues>();
    const [openDatePicker] = useDatePickerModal();
    const dueAtMs = useWatch({ control, name: 'dueAtMs' });
    const dueLabel = formatDayAndMonthAndYear(new Date(dueAtMs));

    const handleOpen = () => {
        openDatePicker({ initialDate: new Date(dueAtMs) }, selectedDate => {
            if (isDefined(selectedDate)) {
                setValue('dueAtMs', selectedDate.getTime(), { shouldDirty: true, shouldValidate: true });
            }
        });
    };

    return (
        <FormItem label={t`Due date`}>
            <RuleSelectorButton testID={BudgetSelector.FundDueField} value={dueLabel} onPress={handleOpen} />
        </FormItem>
    );
};
