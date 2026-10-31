import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Input } from '../../../@generic/component/input/input';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { BudgetFundFormValues } from '../../constant/budget-fund-form-schema.constant';
import { FUND_YEARLY_MONTHS } from '../../constant/budget-fund-repeat-months.constant';
import { BudgetFundRepeatEnum } from '../../enum/budget-fund-repeat.enum';
import { resolveFundRepeat } from '../../utils/resolve-fund-repeat.util';

const FUND_DEFAULT_CUSTOM_MONTHS = 6;

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
        <GroupedListSection title={t`Repeats`}>
            <View className="gap-y-md px-3xl py-lg">
                <SegmentedTabs options={options} value={selected} onChange={handleChange} />
                {customInput}
            </View>
        </GroupedListSection>
    );
};
