/* eslint-disable react/jsx-max-depth */
import { i18n } from '@lingui/core';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

import migrations from '../../drizzle/migrations';
import '../account/task/account-balance-incremental.task';
import '../exchange-rate/task/exchange-rate-sync.task';
import '../global.css';
import { ScreenLayout } from '../@generic/component/screen-layout/screen-layout';
import { CATEGORY_EDIT_MODAL_OPTIONS } from '../@generic/constant/category-edit-modal-options.constant';
import { CONVERT_TO_TRANSFER_MODAL_OPTIONS } from '../@generic/constant/convert-to-transfer-modal-options.constant';
import { DATE_PICKER_MODAL_OPTIONS } from '../@generic/constant/date-picker-modal-options.constant';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { ICON_SELECTOR_MODAL_OPTIONS } from '../@generic/constant/icon-selector-modal-options.constant';
import { NOTE_INPUT_MODAL_OPTIONS } from '../@generic/constant/note-input-modal-options.constant';
import { SELECTOR_MODAL_OPTIONS } from '../@generic/constant/selector-modal-options.constant';
import { SPLIT_ENTRIES_MODAL_OPTIONS } from '../@generic/constant/split-entries-modal-options.constant';
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { useResetDb } from '../@generic/drizzle/hook/use-reset-db.hook';
import { useAppInitialization } from '../@generic/hook/use-app-initialization.hook';
import { useAppState } from '../@generic/hook/use-app-state.hook';
import { CreateActionProvider } from '../@generic/provider/create-action.provider';
import { ModalProvider } from '../@generic/provider/modal.provider';
import { BottomSheetsProvider } from '../@generic/providers/bottom-sheets.provider';
import { AiEmbeddingProgressProvider } from '../ai/provider/ai-embedding-progress.provider';
import { AiStatusProvider } from '../ai/provider/ai-status.provider';
import { LlmDisabledProvider } from '../ai/provider/llm-disabled.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
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
const isAiDisabled = process.env['EXPO_PUBLIC_AI_DISABLE'] === 'true';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access */
const AiProviderWrapper: typeof LlmDisabledProvider = isAiDisabled
    ? LlmDisabledProvider
    : require('../ai/provider/llm.provider').LlmProvider;
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-member-access */
const handleAppStateChange = (isActive: boolean) => void (isActive && monobankSyncService.sync());

// eslint-disable-next-line max-lines-per-function -- Layout component requires many lines
export default function RootLayout() {
    const { success, error } = useMigrations(db, migrations);
    useResetDb(error);
    useAppInitialization(success);
    useAppState(handleAppStateChange);
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
                                            <CreateActionProvider>
                                                <AiProviderWrapper>
                                                    <AiEmbeddingProgressProvider>
                                                        <AiStatusProvider>
                                                            <ModalProvider>
                                                                <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
                                                                    <Stack.Screen name="(tabs)" />
                                                                    <Stack.Screen name="(main)/pin" />
                                                                    <Stack.Screen name="(main)/create-account" />
                                                                    <Stack.Screen name="(main)/account/[id]/details" />
                                                                    <Stack.Screen name="(main)/account/[id]/update" />
                                                                    <Stack.Screen name="(main)/create-transaction/expense" />
                                                                    <Stack.Screen name="(main)/create-transaction/income" />
                                                                    <Stack.Screen name="(main)/create-transaction/transfer" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/expense" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/income" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/transfer" />
                                                                    <Stack.Screen name="(main)/analytics/transactions" />
                                                                    <Stack.Screen
                                                                        name="category-selector"
                                                                        options={SELECTOR_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="account-selector"
                                                                        options={SELECTOR_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="currency-selector"
                                                                        options={SELECTOR_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="language-selector"
                                                                        options={SELECTOR_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="tags-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="category-form"
                                                                        options={CATEGORY_EDIT_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="tag-form" options={CATEGORY_EDIT_MODAL_OPTIONS} />
                                                                    <Stack.Screen name="date-picker" options={DATE_PICKER_MODAL_OPTIONS} />
                                                                    <Stack.Screen name="note-input" options={NOTE_INPUT_MODAL_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="convert-to-transfer"
                                                                        options={CONVERT_TO_TRANSFER_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="icon-selector"
                                                                        options={ICON_SELECTOR_MODAL_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="split-entries"
                                                                        options={SPLIT_ENTRIES_MODAL_OPTIONS}
                                                                    />
                                                                </Stack>
                                                            </ModalProvider>
                                                            <Toast />
                                                        </AiStatusProvider>
                                                    </AiEmbeddingProgressProvider>
                                                </AiProviderWrapper>
                                            </CreateActionProvider>
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
