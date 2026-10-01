/* eslint-disable react/jsx-max-depth */
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as Effect from 'effect/Effect';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';

import '../global.css';
import { DatabaseRestoreScreen } from '../@generic/component/database-restore-screen/database-restore-screen';
import { DevMenuController } from '../@generic/component/dev-menu-controller/dev-menu-controller';
import { ErrorBoundary } from '../@generic/component/error-boundary/error-boundary';
import { ScreenLayout } from '../@generic/component/screen-layout/screen-layout';
import { ScreenshotProtectionController } from '../@generic/component/screenshot-protection-controller/screenshot-protection-controller';
import { APP_TOAST_CONFIG } from '../@generic/constant/app-toast-config.constant';
import { CATEGORY_EDIT_MODAL_OPTIONS } from '../@generic/constant/category-edit-modal-options.constant';
import { CONSOLIDATION_SOURCE_MODAL_OPTIONS } from '../@generic/constant/consolidation-source-modal-options.constant';
import { CONVERT_TO_REFUND_MODAL_OPTIONS } from '../@generic/constant/convert-to-refund-modal-options.constant';
import { CONVERT_TO_TRANSFER_MODAL_OPTIONS } from '../@generic/constant/convert-to-transfer-modal-options.constant';
import { DATABASE_RESTORE_I18N } from '../@generic/constant/database-restore-i18n.constant';
import { DATE_PICKER_MODAL_OPTIONS } from '../@generic/constant/date-picker-modal-options.constant';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { AMOUNT_FILTER_SHEET_OPTIONS, COMPACT_FILTER_SHEET_OPTIONS } from '../@generic/constant/filter-modal-options.constant';
import { ICON_SELECTOR_MODAL_OPTIONS } from '../@generic/constant/icon-selector-modal-options.constant';
import { IMPORT_BACKUP_PIN_MODAL_OPTIONS } from '../@generic/constant/import-backup-pin-modal-options.constant';
import { NOTE_INPUT_MODAL_OPTIONS } from '../@generic/constant/note-input-modal-options.constant';
import { RULE_FORM_MODAL_OPTIONS } from '../@generic/constant/rule-form-modal-options.constant';
import { RULE_SELECTOR_MODAL_OPTIONS } from '../@generic/constant/rule-selector-modal-options.constant';
import {
    DATE_FILTER_SHEET_OPTIONS,
    STACKED_FILTER_MODAL_OPTIONS,
    UNIFIED_FILTER_SHEET_OPTIONS
} from '../@generic/constant/searchable-filter-modal-options.constant';
import { SELECTOR_MODAL_OPTIONS } from '../@generic/constant/selector-modal-options.constant';
import { SPLIT_ENTRIES_MODAL_OPTIONS } from '../@generic/constant/split-entries-modal-options.constant';
import { TRANSACTION_FEE_MODAL_OPTIONS } from '../@generic/constant/transaction-fee-modal-options.constant';
import { VOICE_REVIEW_MODAL_OPTIONS } from '../@generic/constant/voice-review-modal-options.constant';
import { DatabaseMigrationStatusEnum } from '../@generic/drizzle/enum/database-migration-status.enum';
import { useDatabaseMigration } from '../@generic/drizzle/hook/use-database-migration.hook';
import { useAppInitialization } from '../@generic/hook/use-app-initialization.hook';
import { useAppState } from '../@generic/hook/use-app-state.hook';
import { CreateActionProvider } from '../@generic/provider/create-action.provider';
import { ModalProvider } from '../@generic/provider/modal.provider';
import { ScreenChromeThemeProvider } from '../@generic/provider/screen-chrome-theme.provider';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { Workload } from '../@generic/service/workload.service';
import { logAndContinue } from '../@generic/utils/log-and-continue.util';
import { AiProvider } from '../ai/provider/ai.provider';
import { VoiceInputProvider } from '../ai/provider/voice-input.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { HistoricalMarketDataLoaderService } from '../market-data/service/historical-market-data-loader.service';
import { AppDataSyncService } from '../sync/service/app-data-sync.service';
import { ThemeProvider } from '../theme/provider/theme.provider';

enableScreens();
enableFreeze();

void SplashScreen.preventAutoHideAsync();

const handleAppStateChange = (isActive: boolean): void => {
    void appRuntime.runPromise(
        Effect.gen(function* () {
            const workload = yield* Workload;

            if (!isActive) {
                yield* workload.interruptBackground;

                return;
            }

            const appDataSyncService = yield* AppDataSyncService;
            const historicalMarketDataLoaderService = yield* HistoricalMarketDataLoaderService;

            yield* logAndContinue(
                workload.run(
                    Effect.gen(function* () {
                        if (yield* appDataSyncService.sync()) {
                            yield* Effect.forkDetach(logAndContinue(historicalMarketDataLoaderService.enqueueActiveAccounts()));
                        }
                    })
                )
            );
        })
    );
};

// eslint-disable-next-line max-lines-per-function -- Layout component requires many lines
export const RootLayoutContent = () => {
    const databaseMigrationStatus = useDatabaseMigration();

    useAppInitialization(databaseMigrationStatus === DatabaseMigrationStatusEnum.MIGRATED);
    useAppState(handleAppStateChange);

    if (databaseMigrationStatus === DatabaseMigrationStatusEnum.UNOPENABLE) {
        return (
            <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                <LinguiProvider i18n={DATABASE_RESTORE_I18N}>
                    <DatabaseRestoreScreen />
                </LinguiProvider>
            </SafeAreaProvider>
        );
    }

    if (databaseMigrationStatus !== DatabaseMigrationStatusEnum.MIGRATED) {
        return null;
    }

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            {__DEV__ && <DevMenuController />}
            <ScreenshotProtectionController />
            <I18nProvider>
                <KeyboardProvider>
                    <ThemeProvider>
                        <ScreenChromeThemeProvider>
                            <GestureHandlerRootView className="flex-1">
                                <ErrorBoundary>
                                    <AuthProvider>
                                        <AuthGuard>
                                            <CreateActionProvider>
                                                <AiProvider>
                                                    <ModalProvider>
                                                        <VoiceInputProvider>
                                                            <Stack screenOptions={DEFAULT_STACK_OPTIONS} screenLayout={ScreenLayout}>
                                                                <Stack.Screen name="(tabs)" />
                                                                <Stack.Screen name="onboarding" />
                                                                <Stack.Screen name="(main)/pin" />
                                                                <Stack.Screen name="(main)/create-account" />
                                                                <Stack.Screen name="(main)/account/[id]/details" />
                                                                <Stack.Screen name="(main)/account/[id]/update" />
                                                                <Stack.Screen name="(main)/currency/[id]" />
                                                                <Stack.Screen name="(main)/create-transaction/expense" />
                                                                <Stack.Screen name="(main)/create-transaction/income" />
                                                                <Stack.Screen name="(main)/create-transaction/transfer" />
                                                                <Stack.Screen name="(main)/matching-rules" />
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
                                                                <Stack.Screen
                                                                    name="convert-to-refund"
                                                                    options={CONVERT_TO_REFUND_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen name="icon-selector" options={ICON_SELECTOR_MODAL_OPTIONS} />
                                                                <Stack.Screen name="split-entries" options={SPLIT_ENTRIES_MODAL_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="transaction-fee"
                                                                    options={TRANSACTION_FEE_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="consolidation-source"
                                                                    options={CONSOLIDATION_SOURCE_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="import-column-mapper"
                                                                    options={UNIFIED_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="import-backup-pin"
                                                                    options={IMPORT_BACKUP_PIN_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-type-filter"
                                                                    options={COMPACT_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen name="date-filter" options={DATE_FILTER_SHEET_OPTIONS} />
                                                                <Stack.Screen
                                                                    name="transaction-amount-filter"
                                                                    options={AMOUNT_FILTER_SHEET_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-category-filter"
                                                                    options={STACKED_FILTER_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-account-filter"
                                                                    options={STACKED_FILTER_MODAL_OPTIONS}
                                                                />
                                                                <Stack.Screen
                                                                    name="transaction-tag-filter"
                                                                    options={STACKED_FILTER_MODAL_OPTIONS}
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
                                </ErrorBoundary>
                            </GestureHandlerRootView>
                        </ScreenChromeThemeProvider>
                    </ThemeProvider>
                </KeyboardProvider>
            </I18nProvider>
        </SafeAreaProvider>
    );
};
