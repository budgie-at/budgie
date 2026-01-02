import { BudgetPeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { DateInput } from '../../../@generic/component/date-input/date-input';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Input } from '../../../@generic/component/input/input';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useBudgetForm } from '../../hook/use-budget-form.hook';
import { BudgetPeriodSelector } from '../budget-period-selector/budget-period-selector';
import { BudgetStartDaySelector } from '../budget-start-day-selector/budget-start-day-selector';
import { BudgetFormValues } from '../../schema/budget-form.schema';

export const CreateBudget = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();

    const { control, handleSubmit, instrument } = useBudgetForm({
        instrumentId: defaultInstrument.id
    });

    const period = useWatch({ control, name: 'period', defaultValue: BudgetPeriodEnum.MONTHLY });
    const isCustomPeriod = period === BudgetPeriodEnum.CUSTOM;

    const getStartDayLabel = () => {
        if (period === BudgetPeriodEnum.WEEKLY || period === BudgetPeriodEnum.BI_WEEKLY) {
            return t`Start Day of Week`;
        }

        if (period === BudgetPeriodEnum.YEARLY) {
            return t`Start Month`;
        }

        if (period === BudgetPeriodEnum.QUARTERLY) {
            return t`Start Month of Quarter`;
        }

        return t`Start Day of Month`;
    };

    const handleGoBack = () => void goBackOrReplace('/');

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    const renderTitle = ({ field: { onChange, value }, fieldState: { error } }: UseControllerReturn<BudgetFormValues, 'title'>) => (
        <FormItem label={t`Budget Name`} error={error?.message}>
            <Input placeholder={t`e.g., Monthly Budget`} value={value} onChangeText={onChange} autoCapitalize="sentences" />
        </FormItem>
    );

    const renderCustomEndDate = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<BudgetFormValues, 'customEndDate'>) => (
        <FormItem label={t`End Date`} error={error?.message}>
            <DateInput value={value} onChange={onChange} placeholder={t`End`} />
        </FormItem>
    );

    const renderPeriod = ({ field: { onChange, value }, fieldState: { error } }: UseControllerReturn<BudgetFormValues, 'period'>) => (
        <FormItem label={t`Budget Period`} error={error?.message}>
            <BudgetPeriodSelector value={value} onSelect={onChange} />
        </FormItem>
    );

    const renderCustomStartDate = ({
        field: { onChange, value },
        fieldState: { error }
    }: UseControllerReturn<BudgetFormValues, 'customStartDate'>) => (
        <FormItem label={t`Start Date`} error={error?.message}>
            <DateInput value={value} onChange={onChange} placeholder={t`Start`} />
        </FormItem>
    );

    const renderStartDay = ({ field: { onChange, value }, fieldState: { error } }: UseControllerReturn<BudgetFormValues, 'startDay'>) => (
        <FormItem label={getStartDayLabel()} error={error?.message}>
            <BudgetStartDaySelector period={period} value={value} onSelect={onChange} />
        </FormItem>
    );

    return (
        <Page
            header={<PageHeader title={t`New Budget`} description={t`Set up your spending plan`} onGoBack={handleGoBack} />}
            footer={
                <KeyboardStickyView>
                    <Footer>
                        <Button variant="primary" onPress={handleSubmit} content={t`Create Budget`} />
                    </Footer>
                </KeyboardStickyView>
            }
        >
            <KeyboardAwareScrollView
                contentContainerClassName="pb-5xl"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FormLayoutGroup>
                    <Controller name="title" control={control} render={renderTitle} />

                    <Controller name="period" control={control} render={renderPeriod} />

                    {isCustomPeriod ? (
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <Controller name="customStartDate" control={control} render={renderCustomStartDate} />
                            </View>

                            <View className="flex-1">
                                <Controller name="customEndDate" control={control} render={renderCustomEndDate} />
                            </View>
                        </View>
                    ) : (
                        <Controller name="startDay" control={control} render={renderStartDay} />
                    )}

                    <CreateAccountCurrencyField control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
