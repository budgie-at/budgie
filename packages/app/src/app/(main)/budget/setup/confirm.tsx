import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../../@generic/component/button/button';
import { Footer } from '../../../../@generic/component/footer/footer';
import { Page } from '../../../../@generic/component/page/page';
import { PageHeader } from '../../../../@generic/component/page-header/page-header';
import { useShowError } from '../../../../@generic/hook/use-show-error.hook';
import { useBudgetSetupContext } from '../../../../budget/context/budget-setup.context';
import { budgetService } from '../../../../budget/service/budget.service';
import { useFormatDigits } from '../../../../i18n/hook/use-format-digits.hook';
import { SettingsCard } from '../../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../../settings/components/settings-group/settings-group';
import { useSettingsContext } from '../../../../settings/context/settings.context';

const BUDGET_PERIOD_LABELS: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly`,
    [BudgetPeriodEnum.BI_WEEKLY]: msg`Bi-Weekly`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly`
};

// eslint-disable-next-line max-statements
export default function BudgetSetupConfirmPage() {
    const { i18n, t } = useLingui();

    const { form } = useBudgetSetupContext();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const showError = useShowError();
    const formatMoney = useFormatDigits(decimalPlaces);

    const values = form.watch();

    const handleGoBack = () => void router.back();

    const handleCreateBudget = async () => {
        try {
            await budgetService.create(values);
            router.replace('/budget');
        } catch (error: unknown) {
            showError(error);
        }
    };

    const periodLabel = i18n.t(BUDGET_PERIOD_LABELS[values.period]);
    const { periodStartDay } = values;
    const periodDescription = t`${periodLabel} starting on day ${periodStartDay}`;
    const overallLimitFormatted = formatMoney(values.overallLimit, defaultInstrument.symbol);

    const categoryLimitsCount = values.categoryLimits.length;
    const categoryLimitsTotal = values.categoryLimits.reduce((sum, limit) => sum + limit.limit, 0);
    const categoryLimitsTotalFormatted = formatMoney(categoryLimitsTotal, defaultInstrument.symbol);
    const categoryLimitsDescription = t`${categoryLimitsCount} categories, ${categoryLimitsTotalFormatted} allocated`;

    const incomeExpectationsCount = values.incomeExpectations.length;
    const incomeExpectationsTotal = values.incomeExpectations.reduce((sum, expectation) => sum + expectation.expectedAmount, 0);
    const incomeExpectationsTotalFormatted = formatMoney(incomeExpectationsTotal, defaultInstrument.symbol);
    const incomeExpectationsDescription = t`${incomeExpectationsCount} sources, ${incomeExpectationsTotalFormatted} expected`;

    /* jscpd:ignore-start */
    return (
        <Page
            header={<PageHeader title={t`Confirm Budget`} onGoBack={handleGoBack} />}
            footer={
                <Footer>
                    <View className="flex-row gap-x-md">
                        <Button className="flex-1" variant="ghost" content={<Trans>Back</Trans>} onPress={handleGoBack} />
                        <Button
                            className="flex-1"
                            variant="primary"
                            leftIcon={UserIconNameEnum.CircleCheck}
                            content={<Trans>Create Budget</Trans>}
                            onPress={handleCreateBudget}
                        />
                    </View>
                </Footer>
            }
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="py-5xl gap-y-7xl">
                    <SettingsGroup title={t`Budget Summary`}>
                        <SettingsCard
                            icon={UserIconNameEnum.Calendar}
                            variant="default"
                            title={t`Period`}
                            description={periodDescription}
                        />
                        <SettingsCard
                            icon={UserIconNameEnum.DollarSign}
                            variant="positive"
                            title={t`Overall Limit`}
                            description={overallLimitFormatted}
                        />
                    </SettingsGroup>

                    {isNotEmptyArray(values.categoryLimits) ? (
                        <SettingsGroup title={t`Category Budgets`}>
                            <View className="rounded-xl bg-secondary-background px-lg py-md">
                                <Text className="text-sm text-primary">{categoryLimitsDescription}</Text>
                            </View>
                        </SettingsGroup>
                    ) : null}

                    {isNotEmptyArray(values.incomeExpectations) ? (
                        <SettingsGroup title={t`Income Expectations`}>
                            <View className="rounded-xl bg-secondary-background px-lg py-md">
                                <Text className="text-sm text-primary">{incomeExpectationsDescription}</Text>
                            </View>
                        </SettingsGroup>
                    ) : null}
                </View>
            </ScrollView>
        </Page>
    );
    /* jscpd:ignore-end */
}
