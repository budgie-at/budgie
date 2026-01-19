import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { budgetAlertSettingsRepository } from '../../../@generic/drizzle/db/db';
import { useShowError } from '../../../@generic/hook/use-show-error.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetThresholdBottomSheet } from '../../../budget/components/budget-threshold-bottom-sheet/budget-threshold-bottom-sheet';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { budgetAlertService } from '../../../budget/service/budget-alert.service';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';

interface AlertSettingsInterface {
    readonly warningThreshold: number;
    readonly exceededThreshold: number;
    readonly largeExpenseThreshold: number;
    readonly paceAlertsEnabled: boolean;
    readonly predictiveAlertsEnabled: boolean;
    readonly pushNotificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AlertSettingsInterface = {
    warningThreshold: 80,
    exceededThreshold: 100,
    largeExpenseThreshold: 10,
    paceAlertsEnabled: true,
    predictiveAlertsEnabled: true,
    pushNotificationsEnabled: true
};

/* eslint-disable max-lines-per-function, max-statements */
export default function AlertSettingsPage() {
    const { t } = useLingui();

    const warningThresholdRef = useRef<BottomSheetInterface | null>(null);
    const exceededThresholdRef = useRef<BottomSheetInterface | null>(null);
    const largeExpenseThresholdRef = useRef<BottomSheetInterface | null>(null);

    const { budget, isLoading } = useGetActiveBudgetQuery();
    const [settings, setSettings] = useState<AlertSettingsInterface | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const showError = useShowError();

    const handleGoBack = () => void goBackOrReplace('/budget/settings');

    const loadSettings = async (budgetId: number) => {
        const loadedSettings = await budgetAlertService.getSettings(budgetId);
        setSettings({
            warningThreshold: loadedSettings.warningThreshold,
            exceededThreshold: loadedSettings.exceededThreshold,
            largeExpenseThreshold: loadedSettings.largeExpenseThreshold,
            paceAlertsEnabled: loadedSettings.paceAlertsEnabled,
            predictiveAlertsEnabled: loadedSettings.predictiveAlertsEnabled,
            pushNotificationsEnabled: loadedSettings.pushNotificationsEnabled
        });
        setIsLoadingSettings(false);
    };

    const handleUpdateSetting = async <K extends keyof AlertSettingsInterface>(key: K, value: AlertSettingsInterface[K]) => {
        if (!isDefined(budget) || !isDefined(settings)) {
            return;
        }

        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);

        try {
            await budgetAlertSettingsRepository.upsert(budget.id, newSettings);
        } catch (error: unknown) {
            showError(error);
            setSettings(settings);
        }
    };

    const handleOpenWarningThreshold = () => void warningThresholdRef.current?.open();
    const handleOpenExceededThreshold = () => void exceededThresholdRef.current?.open();
    const handleOpenLargeExpenseThreshold = () => void largeExpenseThresholdRef.current?.open();

    const handleSaveWarningThreshold = (value: number) => void handleUpdateSetting('warningThreshold', value);
    const handleSaveExceededThreshold = (value: number) => void handleUpdateSetting('exceededThreshold', value);
    const handleSaveLargeExpenseThreshold = (value: number) => void handleUpdateSetting('largeExpenseThreshold', value);

    const handleTogglePaceAlerts = (value: boolean) => void handleUpdateSetting('paceAlertsEnabled', value);
    const handleTogglePredictiveAlerts = (value: boolean) => void handleUpdateSetting('predictiveAlertsEnabled', value);
    const handleTogglePushNotifications = (value: boolean) => void handleUpdateSetting('pushNotificationsEnabled', value);

    if (isDefined(budget) && !isDefined(settings) && isLoadingSettings) {
        void loadSettings(budget.id);
    }

    if (isLoading || isLoadingSettings) {
        return (
            <Page header={<PageHeader title={t`Alert Settings`} onGoBack={handleGoBack} />}>
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
            <Page header={<PageHeader title={t`Alert Settings`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>No active budget found</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    const currentSettings = settings ?? DEFAULT_SETTINGS;
    const warningThresholdValue = currentSettings.warningThreshold;
    const exceededThresholdValue = currentSettings.exceededThreshold;
    const largeExpenseThresholdValue = currentSettings.largeExpenseThreshold;

    /* jscpd:ignore-start */

    return (
        <>
            <Page header={<PageHeader title={t`Alert Settings`} onGoBack={handleGoBack} />}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="py-5xl gap-y-7xl">
                        <SettingsGroup title={t`Threshold Alerts`}>
                            <SettingsCard
                                icon={UserIconNameEnum.TriangleAlert}
                                variant="warning"
                                title={t`Warning Threshold`}
                                description={t`${warningThresholdValue}% of budget`}
                                onPress={handleOpenWarningThreshold}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.CircleAlert}
                                variant="destructive"
                                title={t`Exceeded Threshold`}
                                description={t`${exceededThresholdValue}% of budget`}
                                onPress={handleOpenExceededThreshold}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Large Expense Alerts`}>
                            <SettingsCard
                                icon={UserIconNameEnum.TrendingUp}
                                variant="default"
                                title={t`Large Expense Threshold`}
                                description={t`${largeExpenseThresholdValue}% of overall budget`}
                                onPress={handleOpenLargeExpenseThreshold}
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Alert Types`}>
                            <SettingsCard
                                icon={UserIconNameEnum.Activity}
                                variant="primary"
                                title={t`Pace Alerts`}
                                description={t`Alert when spending faster than planned`}
                                right={<ThemedSwitch value={currentSettings.paceAlertsEnabled} onValueChange={handleTogglePaceAlerts} />}
                            />
                            <SettingsCard
                                icon={UserIconNameEnum.ChartLine}
                                variant="ghost"
                                title={t`Predictive Alerts`}
                                description={t`Alert when projected to exceed budget`}
                                right={
                                    <ThemedSwitch
                                        value={currentSettings.predictiveAlertsEnabled}
                                        onValueChange={handleTogglePredictiveAlerts}
                                    />
                                }
                            />
                        </SettingsGroup>

                        <SettingsGroup title={t`Notifications`}>
                            <SettingsCard
                                icon={UserIconNameEnum.Bell}
                                variant="positive"
                                title={t`Push Notifications`}
                                description={t`Receive push notifications for alerts`}
                                right={
                                    <ThemedSwitch
                                        value={currentSettings.pushNotificationsEnabled}
                                        onValueChange={handleTogglePushNotifications}
                                    />
                                }
                            />
                        </SettingsGroup>
                    </View>
                </ScrollView>
            </Page>

            <BudgetThresholdBottomSheet
                ref={warningThresholdRef}
                title={t`Warning Threshold %`}
                value={currentSettings.warningThreshold}
                onSave={handleSaveWarningThreshold}
            />

            <BudgetThresholdBottomSheet
                ref={exceededThresholdRef}
                title={t`Exceeded Threshold %`}
                value={currentSettings.exceededThreshold}
                onSave={handleSaveExceededThreshold}
            />

            <BudgetThresholdBottomSheet
                ref={largeExpenseThresholdRef}
                title={t`Large Expense Threshold %`}
                value={currentSettings.largeExpenseThreshold}
                onSave={handleSaveLargeExpenseThreshold}
            />
        </>
    );

    /* jscpd:ignore-end */
}
