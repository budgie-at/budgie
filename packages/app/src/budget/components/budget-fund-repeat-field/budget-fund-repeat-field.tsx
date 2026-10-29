import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { Input } from '../../../@generic/component/input/input';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';
import { FUND_DEFAULT_CUSTOM_MONTHS, FUND_YEARLY_MONTHS } from '../../constant/budget-fund-repeat-months.constant';
import { BudgetFundRepeatEnum } from '../../enum/budget-fund-repeat.enum';
import { resolveFundRepeat } from '../../utils/resolve-fund-repeat.util';

export const BudgetFundRepeatField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<BudgetFundFormValues>();
    const repeatEveryMonths = useWatch({ control, name: 'repeatEveryMonths' });
    const options = [
        { value: BudgetFundRepeatEnum.ONCE, label: t`Once` },
        { value: BudgetFundRepeatEnum.YEARLY, label: t`Every year` },
        { value: BudgetFundRepeatEnum.CUSTOM, label: t`Custom` }
    ];
    const selected = resolveFundRepeat(repeatEveryMonths);
    const customValue = isDefined(repeatEveryMonths) ? String(repeatEveryMonths) : '';
    const handleCustomChange = (text: string) => {
        setValue('repeatEveryMonths', isNotEmptyString(text) ? Number(text) : null, { shouldDirty: true, shouldValidate: true });
    };

    const customInput =
        selected === BudgetFundRepeatEnum.CUSTOM ? (
            <Input
                size="md"
                keyboardType="number-pad"
                value={customValue}
                onChangeText={handleCustomChange}
                placeholder={t`Every N months`}
            />
        ) : null;

    const handleChange = (repeat: BudgetFundRepeatEnum) => {
        const nextMonths = {
            [BudgetFundRepeatEnum.ONCE]: null,
            [BudgetFundRepeatEnum.YEARLY]: FUND_YEARLY_MONTHS,
            [BudgetFundRepeatEnum.CUSTOM]: FUND_DEFAULT_CUSTOM_MONTHS
        }[repeat];

        setValue('repeatEveryMonths', nextMonths, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <FormItem label={t`Repeats`}>
            <SegmentedTabs options={options} value={selected} onChange={handleChange} />
            {customInput}
        </FormItem>
    );
};
