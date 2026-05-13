/* eslint-disable react/jsx-max-depth */
import { i18n } from '@lingui/core';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

import migrations from '../../drizzle/migrations';
import '../account/task/account-balance-incremental.task';
import '../exchange-rate/task/exchange-rate-sync.task';
import '../sync/task/monobank-sync.task';
import '../sync/task/transfer-consolidation.task';
import '../global.css';
import { DevMenuController } from '../@generic/component/dev-menu-controller/dev-menu-controller';
import { ScreenLayout } from '../@generic/component/screen-layout/screen-layout';
import { ScreenshotProtectionController } from '../@generic/component/screenshot-protection-controller/screenshot-protection-controller';
import { APP_TOAST_CONFIG } from '../@generic/constant/app-toast-config.constant';
import { CATEGORY_EDIT_MODAL_OPTIONS } from '../@generic/constant/category-edit-modal-options.constant';
import { CONSOLIDATION_SOURCE_MODAL_OPTIONS } from '../@generic/constant/consolidation-source-modal-options.constant';
import { CONVERT_TO_TRANSFER_MODAL_OPTIONS } from '../@generic/constant/convert-to-transfer-modal-options.constant';
import { DATE_PICKER_MODAL_OPTIONS } from '../@generic/constant/date-picker-modal-options.constant';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { COMPACT_FILTER_SHEET_OPTIONS } from '../@generic/constant/filter-modal-options.constant';
import { ICON_SELECTOR_MODAL_OPTIONS } from '../@generic/constant/icon-selector-modal-options.constant';
import { NOTE_INPUT_MODAL_OPTIONS } from '../@generic/constant/note-input-modal-options.constant';
import { RULE_FORM_MODAL_OPTIONS } from '../@generic/constant/rule-form-modal-options.constant';
import { RULE_SELECTOR_MODAL_OPTIONS } from '../@generic/constant/rule-selector-modal-options.constant';
import { DATE_FILTER_SHEET_OPTIONS, UNIFIED_FILTER_SHEET_OPTIONS } from '../@generic/constant/searchable-filter-modal-options.constant';
import { SELECTOR_MODAL_OPTIONS } from '../@generic/constant/selector-modal-options.constant';
import { SPLIT_ENTRIES_MODAL_OPTIONS } from '../@generic/constant/split-entries-modal-options.constant';
import { VOICE_REVIEW_MODAL_OPTIONS } from '../@generic/constant/voice-review-modal-options.constant';
import { DB_NAME } from '../@generic/drizzle/constant/db-name.constant';
import { db } from '../@generic/drizzle/db/db';
import { useResetDb } from '../@generic/drizzle/hook/use-reset-db.hook';
import { useAppInitialization } from '../@generic/hook/use-app-initialization.hook';
import { useAppState } from '../@generic/hook/use-app-state.hook';
import { CreateActionProvider } from '../@generic/provider/create-action.provider';
import { ModalProvider } from '../@generic/provider/modal.provider';
import { AiProvider } from '../ai/provider/ai.provider';
import { VoiceInputProvider } from '../ai/provider/voice-input.provider';
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
const handleAppStateChange = (isActive: boolean) => void (isActive && monobankSyncService.sync());

// eslint-disable-next-line max-lines-per-function -- Layout component requires many lines
export const RootLayoutContent = () => {
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
                    {__DEV__ && <DevMenuController />}
                    <ScreenshotProtectionController />
                    <I18nProvider>
                        <KeyboardProvider>
                            <ThemeProvider>
                                <GestureHandlerRootView className="flex-1">
                                    <AuthProvider>
                                        <AuthGuard>
                                            <CreateActionProvider>
                                                <AiProvider>
                                                    <ModalProvider>
                                                        <VoiceInputProvider>
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
                                                                <Stack.Screen name="category-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="account-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="currency-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="language-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="resync-window-picker"
                                                                    options={SELECTOR_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen name="contact-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="tags-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="voice-review" options={VOICE_REVIEW_MODAL_OPTIONS} />
                                                                <Stack.Screen name="category-form" options={CATEGORY_EDIT_MODAL_OPTIONS} />
                                                                <Stack.Screen name="tag-form" options={CATEGORY_EDIT_MODAL_OPTIONS} />
                                                                <Stack.Screen name="date-picker" options={DATE_PICKER_MODAL_OPTIONS} />
                                                                <Stack.Screen name="note-input" options={NOTE_INPUT_MODAL_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="convert-to-transfer"
                                                                    options={CONVERT_TO_TRANSFER_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen name="icon-selector" options={ICON_SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="split-entries" options={SPLIT_ENTRIES_MODAL_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="consolidation-source"
                                                                    options={CONSOLIDATION_SOURCE_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="import-column-mapper"
                                                                    options={UNIFIED_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-type-filter"
                                                                    options={COMPACT_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen name="date-filter" options={DATE_FILTER_SHEET_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="transaction-category-filter"
                                                                    options={UNIFIED_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-account-filter"
                                                                    options={UNIFIED_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-tag-filter"
                                                                    options={UNIFIED_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen name="rule-form" options={RULE_FORM_MODAL_OPTIONS} />
                                                                <Stack.Screen name="rule-selector" options={RULE_SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="rule-mcc-selector" options={SELECTOR_MODAL_OPTIONS} />
                                                            </Stack>
                                                        </VoiceInputProvider>
                                                    </ModalProvider>
                                                    <Toast config={APP_TOAST_CONFIG} />
                                                </AiProvider>
                                            </CreateActionProvider>
                                        </AuthGuard>
                                    </AuthProvider>
                                </GestureHandlerRootView>
                            </ThemeProvider>
                        </KeyboardProvider>
                    </I18nProvider>
                </SettingsProvider>
            </SQLiteProvider>
        </SafeAreaProvider>
    );
};
