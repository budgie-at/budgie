/* eslint-disable react/jsx-max-depth */

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import migrations from '../../drizzle/migrations';
import { appRootPersistor, appRootStore } from '../@generic/app-root.store';
import { i18nGetOSLocale } from '../@generic/utils/i18n.util';
import '../global.css';
import { DB_NAME } from '../drizzle/constant/db-name.constant';
import { db } from '../drizzle/db/db';
import { ThemeProvider } from '../theme/context/theme.context';

enableScreens();
enableFreeze();

i18n.activate(i18nGetOSLocale());

void SplashScreen.preventAutoHideAsync();

const stackOptions = { headerShown: false, gestureEnabled: false };

export default function RootLayout() {
    // eslint-disable-next-line camelcase
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
                        <SQLiteProvider databaseName={DB_NAME} options={{ enableChangeListener: true }}>
                            <Stack screenOptions={stackOptions}>
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                                <Stack.Screen
                                    name="ai"
                                    options={{
                                        headerShown: false,
                                        presentation: 'modal',
                                        gestureEnabled: true
                                    }}
                                />
                            </Stack>
                        </SQLiteProvider>
                    </ThemeProvider>
                </I18nProvider>
            </PersistGate>
        </Provider>
    );
}
