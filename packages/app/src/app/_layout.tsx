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
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { accountBalanceIncrementalService } from '../account/service/account-balance-incremental.service';
import { exchangeRatesService } from '../exchange-rate/service/exchange-rates-sync.service';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { i18nGetOSLocale } from '../i18n/util/i18n.util';
import { SettingsProvider } from '../settings/provider/settings.provider';
import { ThemeProvider } from '../theme/provider/theme.provider';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const SQLOptions = { enableChangeListener: true };

const stackOptions = { headerShown: false };
const tabsOptions = { headerShown: false };
const aiScreenOptions: ExtendedStackNavigationOptions = {
    headerShown: false,
    presentation: 'modal'
};

export default function RootLayout() {
    const { success } = useMigrations(db, migrations);

    useEffect(() => {
        if (success) {
            void exchangeRatesService.sync();
            void exchangeRatesService.registerBackgroundTask();
            void accountBalanceIncrementalService.updateAllSnapshots();
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
                                    <Stack screenOptions={stackOptions}>
                                        <Stack.Screen name="(tabs)" options={tabsOptions} />

                                        <Stack.Screen name="ai" options={aiScreenOptions} />
                                    </Stack>
                                </BottomSheetsProvider>
                            </ThemeProvider>
                        </KeyboardProvider>
                    </I18nProvider>
                </SettingsProvider>
            </SQLiteProvider>
        </SafeAreaProvider>
    );
}
