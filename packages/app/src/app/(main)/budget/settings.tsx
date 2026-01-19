import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { budgetRepository } from '../../../@generic/drizzle/db/db';
import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetLimitAmountBottomSheet } from '../../../budget/components/budget-limit-amount-bottom-sheet/budget-limit-amount-bottom-sheet';
import { BudgetPeriodSelectorBottomSheet } from '../../../budget/components/budget-period-selector-bottom-sheet/budget-period-selector-bottom-sheet';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { budgetService } from '../../../budget/service/budget.service';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { useSettingsContext } from '../../../settings/context/settings.context';

const BUDGET_PERIOD_LABELS: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly`,
    [BudgetPeriodEnum.BI_WEEKLY]: msg`Bi-Weekly`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly`
};

// eslint-disable-next-line max-lines-per-function, max-statements
export default function BudgetSettingsPage() {
    const { i18n, t } = useLingui();

    const periodSelectorRef = useRef<BottomSheetInterface | null>(null);
    const overallLimitRef = useRef<BottomSheetInterface | null>(null);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const showError = useShowError();

    const formatMoney = useFormatDigits(decimalPlaces);

    const handleGoBack = () => void goBackOrReplace('/budget');
    const handleOpenPeriodSelector = () => void periodSelectorRef.current?.open();
    const handleOpenOverallLimit = () => void overallLimitRef.current?.open();
    const handleNavigateToExcludedAccounts = () => void router.push('/budget/excluded-accounts');
    const handleNavigateToCategoryLimits = () => void router.push('/budget/category-limits');
    const handleNavigateToIncomeExpectations = () => void router.push('/budget/income-expectations');
    const handleNavigateToAlerts = () => void router.push('/budget/alerts');
    const handleNavigateToAlertSettings = () => void router.push('/budget/alert-settings');
    const handleNavigateToBudgetHistory = () => void router.push('/budget/history');

    const handleSelectPeriod = async (period: BudgetPeriodEnum) => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetService.update(budget.id, { ...budgetService.getBudgetUpdatePayload(budget), period });
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleSaveOverallLimit = async (overallLimit: number) => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetService.update(budget.id, { ...budgetService.getBudgetUpdatePayload(budget), overallLimit });
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleDeleteBudget = async () => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetRepository.deleteById(budget.id);
            router.replace('/');
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleSimulatePeriodEnd = async () => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetService.simulatePeriodEnd(budget);
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleToggleRollover = async () => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetRepository.updateById(budget.id, { rolloverEnabled: !budget.rolloverEnabled });
        } catch (error: unknown) {
            showError(error);
        }
    };

    const handleToggleDeficitRollover = async () => {
        if (!isDefined(budget)) {
            return;
        }

        try {
            await budgetRepository.updateById(budget.id, { rolloverDeficitEnabled: !budget.rolloverDeficitEnabled });
        } catch (error: unknown) {
            showError(error);
        }
    };

    if (isLoading) {
        return (
            <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    if (!isDefined(budget)) {
        return (
            <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>No active budget found</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    const periodLabel = i18n.t(BUDGET_PERIOD_LABELS[budget.period]);
    const overallLimitFormatted = formatMoney(convertFromMicroUnits(budget.overallLimit), defaultInstrument.symbol);
    const rolloverEnabledDescription = budget.rolloverEnabled ? t`Enabled` : t`Disabled`;
    const rolloverDeficitDescription = budget.rolloverDeficitEnabled ? t`Enabled` : t`Disabled`;
    const rolloverDeficitVariant = budget.rolloverDeficitEnabled ? 'warning' : 'ghost';
    const rolloverAmountVariant = budget.rolloverAmount >= 0 ? 'positive' : 'destructive';

    /* jscpd:ignore-start */
    return (
        <>
            <Page header={<PageHeader title={t`Budget Settings`} onGoBack={handleGoBack} />}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="py-5xl gap-y-7xl">
                        <SettingsGroup title={t`Budget Configuration`}>
                            <SettingsCard
                                icon={UserIconNameEnum.Calendar}
                                variant="default"
                                title={t`Budget Period`}
                                description={periodLabel}
                                onPress={handleOpenPeriodSelector}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.DollarSign}
                                variant="positive"
                                title={t`Overall Limit`}
                                description={overallLimitFormatted}
                                onPress={handleOpenOverallLimit}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.CalendarDays}
                                variant="ghost"
                                title={t`Period Start Day`}
                                description={String(budget.periodStartDay)}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.Wallet}
                                variant="pink"
                                title={t`Excluded Accounts`}
                                description={t`Choose which accounts to exclude from budget`}
                                onPress={handleNavigateToExcludedAccounts}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.ChartPie}
                                variant="primary"
                                title={t`Category Limits`}
                                description={t`Set spending limits for categories`}
                                onPress={handleNavigateToCategoryLimits}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.TrendingUp}
                                variant="positive"
                                title={t`Income Expectations`}
                                description={t`Set expected income by category`}
                                onPress={handleNavigateToIncomeExpectations}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Rollover`}>
                            <SettingsCard
                                icon={UserIconNameEnum.RefreshCw}
                                variant="primary"
                                title={t`Carry Over Unspent Budget`}
                                description={rolloverEnabledDescription}
                                onPress={handleToggleRollover}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.TrendingDown}
                                variant={rolloverDeficitVariant}
                                title={t`Include Deficit in Rollover`}
                                description={rolloverDeficitDescription}
                                onPress={handleToggleDeficitRollover}
                                disabled={!budget.rolloverEnabled}
                            />
                            {isNumber(budget.rolloverAmount) && budget.rolloverAmount !== 0 ? (
                                <SettingsCard
                                    icon={UserIconNameEnum.Wallet}
                                    variant={rolloverAmountVariant}
                                    title={t`Current Rollover`}
                                    description={formatMoney(convertFromMicroUnits(budget.rolloverAmount), defaultInstrument.symbol)}
                                />
                            ) : null}
                        </SettingsGroup>

                        <SettingsGroup title={t`Alerts`}>
                            <SettingsCard
                                icon={UserIconNameEnum.Bell}
                                variant="warning"
                                title={t`Budget Alerts`}
                                description={t`View and manage alerts`}
                                onPress={handleNavigateToAlerts}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.Settings}
                                variant="default"
                                title={t`Alert Settings`}
                                description={t`Configure thresholds and notifications`}
                                onPress={handleNavigateToAlertSettings}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`History`}>
                            <SettingsCard
                                icon={UserIconNameEnum.Clock}
                                variant="default"
                                title={t`Budget History`}
                                description={t`View past periods and trends`}
                                onPress={handleNavigateToBudgetHistory}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Danger Zone`}>
                            <Button
                                content={<Trans>Delete Budget</Trans>}
                                variant="destructive"
                                onPress={handleDeleteBudget}
                                leftIcon={UserIconNameEnum.Trash2}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Debug (Remove Later)`}>
                            <Button
                                content={<Trans>Simulate Period End</Trans>}
                                variant="secondary"
                                onPress={handleSimulatePeriodEnd}
                                leftIcon={UserIconNameEnum.FastForward}
                            />
                        </SettingsGroup>
                    </View>
                </ScrollView>
            </Page>

            <BudgetPeriodSelectorBottomSheet ref={periodSelectorRef} selectedPeriod={budget.period} onSelect={handleSelectPeriod} />

            <BudgetLimitAmountBottomSheet
                ref={overallLimitRef}
                title={t`Overall Limit`}
                value={convertFromMicroUnits(budget.overallLimit)}
                onSave={handleSaveOverallLimit}
            />
        </>
    );
    /* jscpd:ignore-end */
}
