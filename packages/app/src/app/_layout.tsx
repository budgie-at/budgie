/* eslint-disable react/jsx-max-depth */
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import migrations from '../../drizzle/migrations';
import { appRootPersistor, appRootStore } from '../@generic/app-root.store';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { i18nGetOSLocale } from '../@generic/utils/i18n.util';
import '../global.css';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { db } from '../drizzle/db/db';
import { ThemeProvider } from '../theme/context/theme.context';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const SQLOptions = { enableChangeListener: true };

const stackOptions: NativeStackNavigationOptions = {
    headerShown: false,
    gestureEnabled: false,
    contentStyle: { backgroundColor: 'black' }
};
const tabsOptions = { headerShown: false, gestureEnabled: true, contentStyle: { backgroundColor: 'black' } };
const mainOptions = { headerShown: false, gestureEnabled: true, contentStyle: { backgroundColor: 'black' } };
const aiScreenOptions: ExtendedStackNavigationOptions = {
    headerShown: false,
    presentation: 'modal',
    gestureEnabled: true
};

export default function RootLayout() {
    const { success } = useMigrations(db, migrations);

    useEffect(() => {
        if (success) {
            void SplashScreen.hideAsync();
        }
    }, [success]);

    if (!success) {
        return null;
    }

    return (
        <Provider store={appRootStore}>
            <PersistGate loading={null} persistor={appRootPersistor}>
                <I18nProvider i18n={i18n}>
                    <ThemeProvider>
                        <SQLiteProvider databaseName={DB_NAME} options={SQLOptions}>
                            <BottomSheetsProvider>
                                <Stack screenOptions={stackOptions}>
                                    <Stack.Screen name="(tabs)" options={tabsOptions} />
                                    <Stack.Screen name="(main)" options={mainOptions} />

                                    <Stack.Screen name="(modals)/ai" options={aiScreenOptions} />
                                </Stack>
                            </BottomSheetsProvider>
                        </SQLiteProvider>
                    </ThemeProvider>
                </I18nProvider>
            </PersistGate>
        </Provider>
    );
}
