import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { enableFreeze, enableScreens } from 'react-native-screens';

import migrations from '../../drizzle/migrations';
import '../exchange-rate/task/exchange-rate-sync.task';
import '../global.css';
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { i18nGetOSLocale } from '../@generic/utils/i18n.util';
import { exchangeRatesService } from '../exchange-rate/service/exchange-rates-sync.service';
import { SettingsProvider } from '../settings/provider/settings.provider';
import { ThemeProvider } from '../theme/context/theme.context';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const SQLOptions = { enableChangeListener: true };

const stackOptions = { headerShown: false, gestureEnabled: false };
const tabsOptions = { headerShown: false };
const aiScreenOptions: ExtendedStackNavigationOptions = {
    headerShown: false,
    presentation: 'modal',
    gestureEnabled: true
};

export default function RootLayout() {
    const { success } = useMigrations(db, migrations);

    useEffect(() => {
        if (success) {
            void exchangeRatesService.sync();
            void exchangeRatesService.registerBackgroundTask();
            void SplashScreen.hideAsync();
        }
    }, [success]);

    if (!success) {
        return null;
    }

    return (
        <SQLiteProvider databaseName={DB_NAME} options={SQLOptions}>
            <SettingsProvider>
                <I18nProvider i18n={i18n}>
                    <ThemeProvider>
                        <BottomSheetsProvider>
                            <Stack screenOptions={stackOptions}>
                                <Stack.Screen name="(tabs)" options={tabsOptions} />

                                <Stack.Screen name="ai" options={aiScreenOptions} />
                            </Stack>
                        </BottomSheetsProvider>
                    </ThemeProvider>
                </I18nProvider>
            </SettingsProvider>
        </SQLiteProvider>
    );
}
