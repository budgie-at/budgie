/* eslint-disable react/jsx-max-depth */
import { i18n } from '@lingui/core';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { Fragment, useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import migrations from '../../drizzle/migrations';
import '../account/task/account-balance-incremental.task';
import '../budget/task/budget-transition.task';
import '../exchange-rate/task/exchange-rate-sync.task';
import '../global.css';
import { ScreenLayout } from '../@generic/component/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { useResetDb } from '../@generic/drizzle/hook/use-reset-db.hook';
import { useAppState } from '../@generic/hook/use-app-state.hook';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { accountBalanceIncrementalService } from '../account/service/account-balance-incremental.service';
import { LlmProvider } from '../ai/provider/llm.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
import { budgetService } from '../budget/service/budget.service';
import { exchangeRatesSyncService } from '../exchange-rate/service/exchange-rates-sync.service';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { i18nGetOSLocale } from '../i18n/util/i18n.util';
import { SettingsProvider } from '../settings/provider/settings.provider';
import { monobankSyncService } from '../sync/service/monobank-sync.service';
import { ThemeProvider } from '../theme/provider/theme.provider';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const SQLOptions = { enableChangeListener: true };
// eslint-disable-next-line dot-notation
const isAiDisabled = process.env['AI_DISABLE'] === 'true';
const AiProviderWrapper = isAiDisabled ? Fragment : LlmProvider;
const aiScreenOptions: ExtendedStackNavigationOptions = {
    ...DEFAULT_STACK_OPTIONS,
    presentation: 'modal'
};

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);

    // TODO: REMOVE ME WHEN DB IS STABLE!
    useResetDb(error);

    useEffect(() => {
        const init = async () => {
            if (success) {
                try {
                    void exchangeRatesSyncService.sync();
                    void exchangeRatesSyncService.registerBackgroundTask();

                    void accountBalanceIncrementalService.updateAllBalances(false);
                    void accountBalanceIncrementalService.registerBackgroundTask();

                    void monobankSyncService.sync();

                    void budgetService.ensureSingleActiveBudget();
                    void budgetService.ensureActiveBudgetHasCurrentInstance();
                    void budgetService.checkAndTransitionActiveBudget();
                    void budgetService.registerBackgroundTask();

                    void monobankSyncService.registerBackgroundTask();
                } catch (e: unknown) {
                    // eslint-disable-next-line no-console
                    console.log(getErrorMessage(e));
                } finally {
                    // HINT: We need to time for db to return data
                    setTimeout(() => void SplashScreen.hideAsync(), 200);
                }
            }
        };

        void init();
    }, [success]);

    useAppState(isActive => {
        if (isActive) {
            void monobankSyncService.sync();
            void budgetService.checkAndTransitionActiveBudget();
        }
    });

    if (!success) {
        return null;
    }

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <SQLiteProvider databaseName={DB_NAME} options={SQLOptions}>
                <SettingsProvider>
                    <I18nProvider>
                        <KeyboardProvider>
                            <ThemeProvider>
                                <BottomSheetsProvider>
                                    <AuthProvider>
                                        <AuthGuard>
                                            <AiProviderWrapper>
                                                <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
                                                    <Stack.Screen name="(tabs)" />

                                                    <Stack.Screen name="(main)/pin" />
                                                    <Stack.Screen name="(main)/create-account" />

                                                    <Stack.Screen name="(main)/budget/[id]/allocation/[allocationId]" />
                                                    <Stack.Screen name="(main)/budget/[id]/add-allocation" />
                                                    <Stack.Screen name="(main)/budget/[id]/index" />
                                                    <Stack.Screen name="(main)/budget/create" />

                                                    <Stack.Screen name="(main)/account/[id]/update" />
                                                    <Stack.Screen name="(main)/account/[id]/details" />

                                                    <Stack.Screen name="(main)/create-transaction/expense" />
                                                    <Stack.Screen name="(main)/create-transaction/income" />
                                                    <Stack.Screen name="(main)/create-transaction/transfer" />

                                                    <Stack.Screen name="(main)/transactions/[id]/expense" />
                                                    <Stack.Screen name="(main)/transactions/[id]/income" />
                                                    <Stack.Screen name="(main)/transactions/[id]/transfer" />

                                                    <Stack.Screen name="(main)/settings/index" />
                                                    <Stack.Screen name="(main)/settings/budgets" />
                                                    <Stack.Screen name="(main)/settings/pin" />
                                                    <Stack.Screen name="(main)/settings/categories" />
                                                    <Stack.Screen name="(main)/settings/tags" />
                                                    <Stack.Screen name="(main)/settings/archived" />
                                                    <Stack.Screen name="(main)/settings/import" />

                                                    <Stack.Screen name="(main)/ai" options={aiScreenOptions} />
                                                </Stack>
                                                <Toast />
                                            </AiProviderWrapper>
                                        </AuthGuard>
                                    </AuthProvider>
                                </BottomSheetsProvider>
                            </ThemeProvider>
                        </KeyboardProvider>
                    </I18nProvider>
                </SettingsProvider>
            </SQLiteProvider>
        </SafeAreaProvider>
    );
}
