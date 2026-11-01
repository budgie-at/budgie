import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { RadioOptionRow } from '../../../@generic/component/radio-option-row/radio-option-row';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { useBudgetExpectedIncomeHint } from '../../hooks/use-budget-expected-income-hint.hook';
import { BudgetOverallLimitField } from '../budget-overall-limit-field/budget-overall-limit-field';

interface Props {
    readonly currencySymbol: string;
}

export const BudgetLimitSourceField = ({ currencySymbol }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const expectedIncomeHint = useBudgetExpectedIncomeHint();

    const render = ({ field: { value, onChange } }: UseControllerReturn<BudgetFormValues, 'limitSource'>) => {
        const handleFixedPress = () => void onChange(BudgetLimitSourceEnum.FIXED);
        const handleReceivedPress = () => void onChange(BudgetLimitSourceEnum.INCOME_RECEIVED);
        const fixedLimitField =
            value === BudgetLimitSourceEnum.FIXED ? <BudgetOverallLimitField control={control} currencySymbol={currencySymbol} /> : null;
        const handleExpectedPress = () => void onChange(BudgetLimitSourceEnum.INCOME_EXPECTED);

        return (
            <GroupedListSection title={t`Limit from`}>
                <View className="px-3xl py-sm">
                    <RadioOptionRow
                        label={t`Fixed amount`}
                        isSelected={value === BudgetLimitSourceEnum.FIXED}
                        onPress={handleFixedPress}
                        testID={BudgetSelector.SetupLimitSourceRow(BudgetLimitSourceEnum.FIXED)}
                    >
                        {fixedLimitField}
                    </RadioOptionRow>
                    <RadioOptionRow
                        label={t`Income received`}
                        description={t`Your limit grows as income arrives this period`}
                        isSelected={value === BudgetLimitSourceEnum.INCOME_RECEIVED}
                        onPress={handleReceivedPress}
                        testID={BudgetSelector.SetupLimitSourceRow(BudgetLimitSourceEnum.INCOME_RECEIVED)}
                    />
                    <RadioOptionRow
                        label={t`Expected income`}
                        description={expectedIncomeHint}
                        isSelected={value === BudgetLimitSourceEnum.INCOME_EXPECTED}
                        onPress={handleExpectedPress}
                        testID={BudgetSelector.SetupLimitSourceRow(BudgetLimitSourceEnum.INCOME_EXPECTED)}
                    />
                </View>
            </GroupedListSection>
        );
    };

    return <Controller control={control} name="limitSource" render={render} />;
};
