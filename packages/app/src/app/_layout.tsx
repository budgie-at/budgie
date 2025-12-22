/* eslint-disable react/jsx-max-depth */
import { i18n } from '@lingui/core';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';

import migrations from '../../drizzle/migrations';
import '../account/task/account-balance-incremental.task';
import '../exchange-rate/task/exchange-rate-sync.task';
import '../global.css';
import { ScreenLayout } from '../@generic/components/screen-layout/screen-layout';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { useResetDb } from '../@generic/drizzle/hook/use-reset-db.hook';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { accountBalanceIncrementalService } from '../account/service/account-balance-incremental.service';
import { LlmProvider } from '../ai/provider/llm.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
import { exchangeRatesService } from '../exchange-rate/service/exchange-rates-sync.service';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { i18nGetOSLocale } from '../i18n/util/i18n.util';
import { SettingsProvider } from '../settings/provider/settings.provider';
import { ThemeProvider } from '../theme/provider/theme.provider';

import Toast from 'react-native-toast-message';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const SQLOptions = { enableChangeListener: true };

const aiScreenOptions: ExtendedStackNavigationOptions = {
    ...DEFAULT_STACK_OPTIONS,
    presentation: 'modal'
};

export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);

    // TODO: REMOVE ME WHEN DB IS STABLE!
    useResetDb(error);

    useEffect(() => {
        if (success) {
            void exchangeRatesService.sync();
            void exchangeRatesService.registerBackgroundTask();
            void accountBalanceIncrementalService.updateAllBalances();
            void accountBalanceIncrementalService.registerBackgroundTask();
            void SplashScreen.hideAsync();
        }
    }, [success]);

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
                                            <LlmProvider>
                                                <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
                                                    <Stack.Screen name="(tabs)" />

                                                    <Stack.Screen name="(main)/pin" />
                                                    <Stack.Screen name="(main)/create-account" />

                                                    <Stack.Screen name="(main)/account/[id]/update" />
                                                    <Stack.Screen name="(main)/account/[id]/details" />

                                                    <Stack.Screen name="(main)/transactions/[id]" />

                                                    <Stack.Screen name="(main)/settings/index" />
                                                    <Stack.Screen name="(main)/settings/pin" />
                                                    <Stack.Screen name="(main)/settings/categories" />
                                                    <Stack.Screen name="(main)/settings/tags" />
                                                    <Stack.Screen name="(main)/settings/archived" />
                                                    <Stack.Screen name="(main)/settings/import" options={aiScreenOptions} />

                                                    <Stack.Screen name="(main)/ai" options={aiScreenOptions} />

                                                    <Toast />
                                                </Stack>
                                            </LlmProvider>
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
