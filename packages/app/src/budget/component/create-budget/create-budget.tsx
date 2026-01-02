import { BudgetPeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { Footer } from '../../../@generic/component/footer/footer';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useBudgetForm } from '../../hook/use-budget-form.hook';
import { getStartDayLabel } from '../../util/get-start-day-label.util';
import { BudgetDateField } from '../budget-date-field/budget-date-field';
import { BudgetPeriodField } from '../budget-period-field/budget-period-field';
import { BudgetStartDayField } from '../budget-start-day-field/budget-start-day-field';
import { BudgetTitleField } from '../budget-title-field/budget-title-field';

export const CreateBudget = () => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const { control, handleSubmit, instrument } = useBudgetForm({ instrumentId: defaultInstrument.id });
    const period = useWatch({ control, name: 'period', defaultValue: BudgetPeriodEnum.MONTHLY });
    const isCustomPeriod = period === BudgetPeriodEnum.CUSTOM;
    const handleGoBack = () => void goBackOrReplace('/');
    const startDayLabel = getStartDayLabel(period, t);

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

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
                    <BudgetTitleField control={control} />
                    <BudgetPeriodField control={control} />
                    {isCustomPeriod ? (
                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <BudgetDateField control={control} name="customStartDate" label={t`Start Date`} placeholder={t`Start`} />
                            </View>
                            <View className="flex-1">
                                <BudgetDateField control={control} name="customEndDate" label={t`End Date`} placeholder={t`End`} />
                            </View>
                        </View>
                    ) : (
                        <BudgetStartDayField control={control} period={period} label={startDayLabel} />
                    )}

                    <CreateAccountCurrencyField control={control} />
                </FormLayoutGroup>
            </KeyboardAwareScrollView>
        </Page>
    );
};
