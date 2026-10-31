/* eslint-disable react/jsx-max-depth */
import { BudgetPeriodCloseService } from '@budgie/budget';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as Effect from 'effect/Effect';
import { Stack, type NativeStackNavigationOptions } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaListener, SafeAreaListenerProps, SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { enableFreeze, enableScreens } from 'react-native-screens';
import { Uniwind, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import '../global.css';
import { AppToastHost } from '../@generic/component/app-toast-host/app-toast-host';
import { DatabaseRestoreScreen } from '../@generic/component/database-restore-screen/database-restore-screen';
import { DevMenuController } from '../@generic/component/dev-menu-controller/dev-menu-controller';
import { ErrorBoundary } from '../@generic/component/error-boundary/error-boundary';
import { ScreenLayout } from '../@generic/component/screen-layout/screen-layout';
import { ScreenshotProtectionController } from '../@generic/component/screenshot-protection-controller/screenshot-protection-controller';
import { DATABASE_RESTORE_I18N } from '../@generic/constant/database-restore-i18n.constant';
import { DEFAULT_STACK_OPTIONS } from '../@generic/constant/default-stack-options.constant';
import { DatabaseMigrationStatusEnum } from '../@generic/drizzle/enum/database-migration-status.enum';
import { useDatabaseMigration } from '../@generic/drizzle/hook/use-database-migration.hook';
import { useAppInitialization } from '../@generic/hook/use-app-initialization.hook';
import { useAppState } from '../@generic/hook/use-app-state.hook';
import { CreateActionProvider } from '../@generic/provider/create-action.provider';
import { ModalProvider } from '../@generic/provider/modal.provider';
import { ScreenChromeThemeProvider } from '../@generic/provider/screen-chrome-theme.provider';
import { appRuntime } from '../@generic/runtime/app.runtime';
import { Workload } from '../@generic/service/workload.service';
import { fitToContentsSheetOptions } from '../@generic/utils/fit-to-contents-sheet-options.util';
import { formSheetOptions } from '../@generic/utils/form-sheet-options.util';
import { logAndContinue } from '../@generic/utils/log-and-continue.util';
import { AiProvider } from '../ai/provider/ai.provider';
import { VoiceInputProvider } from '../ai/provider/voice-input.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
import { BudgetNotificationLaunchHandler } from '../budget/components/budget-notification-launch-handler/budget-notification-launch-handler';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { HistoricalMarketDataDrainerService } from '../market-data/service/historical-market-data-drainer.service';
import { ReceiptLaunchHandler } from '../receipt/components/receipt-launch-handler/receipt-launch-handler';
import { AppDataSyncService } from '../sync/service/app-data-sync.service';
import { ThemeProvider } from '../theme/provider/theme.provider';

const DETENT_95 = 0.95;
const DETENT_46 = 0.46;
const DETENT_12 = 0.12;
const DETENT_90 = 0.9;
const DETENT_70 = 0.7;
const DETENT_40 = 0.4;
const DETENT_55 = 0.55;
const DETENT_85 = 0.85;
const DETENT_82 = 0.82;
const DETENT_96 = 0.96;

const MODAL_OPTIONS: NativeStackNavigationOptions = { presentation: 'modal', headerShown: false };

const STACKED_FILTER_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'pageSheet',
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' }
};

const PIN_OPTIONS: NativeStackNavigationOptions = { ...MODAL_OPTIONS, gestureEnabled: false };

const LOCK_SCREEN_OPTIONS: NativeStackNavigationOptions = { presentation: 'fullScreenModal', animation: 'none' };

const SELECTOR_OPTIONS = formSheetOptions([DETENT_40, DETENT_70], 0);

enableScreens();
enableFreeze();

void SplashScreen.preventAutoHideAsync();

if (isDefined(initialWindowMetrics)) {
    Uniwind.updateInsets(initialWindowMetrics.insets);
}

const handleSafeAreaChange: SafeAreaListenerProps['onChange'] = ({ insets }) => {
    Uniwind.updateInsets(insets);
};

const handleAppStateChange = (isActive: boolean): void => {
    appRuntime.runFork(
        Effect.gen(function* () {
            const workload = yield* Workload;

            if (!isActive) {
                yield* workload.interruptBackground;

                return;
            }

            const appDataSyncService = yield* AppDataSyncService;
            const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;
            const budgetPeriodCloseService = yield* BudgetPeriodCloseService;

            yield* logAndContinue(
                workload.run(
                    Effect.gen(function* () {
                        if (yield* appDataSyncService.sync()) {
                            yield* Effect.forkDetach(logAndContinue(historicalMarketDataDrainerService.enqueueActiveAccounts()));
                        }
                    })
                )
            );
            yield* logAndContinue(workload.run(budgetPeriodCloseService.closeDuePeriods(new Date())));
        })
    );
};

// eslint-disable-next-line max-lines-per-function -- Layout component requires many lines
export const RootLayoutContent = () => {
    const databaseMigrationStatus = useDatabaseMigration();
    const [sheetSurface, groupedSheetSurface] = useCSSVariable(['--color-primary-reverse', '--color-grouped-surface']);
    const sheetOptions = fitToContentsSheetOptions(sheetSurface);

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
            <SafeAreaListener onChange={handleSafeAreaChange}>
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
                                                                    <Stack.Screen name="(main)/pin" options={LOCK_SCREEN_OPTIONS} />
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
                                                                    <Stack.Screen name="(main)/categorize" />
                                                                    <Stack.Screen name="category-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="account-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="currency-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="language-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="resync-window-picker" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="contact-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen name="tags-selector" options={SELECTOR_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="voice-review"
                                                                        options={formSheetOptions([0.65, DETENT_95], 0)}
                                                                    />
                                                                    <Stack.Screen name="budget-safe-to-spend" options={sheetOptions} />
                                                                    <Stack.Screen name="budget-fund-form" options={sheetOptions} />
                                                                    <Stack.Screen name="budget-limit-changes" options={sheetOptions} />
                                                                    <Stack.Screen name="category-form" options={MODAL_OPTIONS} />
                                                                    <Stack.Screen name="tag-form" options={MODAL_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="date-picker"
                                                                        options={formSheetOptions([DETENT_46])}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="note-input"
                                                                        options={formSheetOptions([DETENT_12])}
                                                                    />
                                                                    <Stack.Screen name="bank-integration-key" options={sheetOptions} />
                                                                    <Stack.Screen name="convert-to-transfer" options={MODAL_OPTIONS} />
                                                                    <Stack.Screen name="convert-to-installment" options={sheetOptions} />
                                                                    <Stack.Screen
                                                                        name="convert-to-refund"
                                                                        options={formSheetOptions([DETENT_90, 1], 0)}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="icon-selector"
                                                                        options={formSheetOptions([0.6, DETENT_90])}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="split-entries"
                                                                        options={formSheetOptions([0.3, DETENT_70])}
                                                                    />
                                                                    <Stack.Screen name="transaction-fee" options={sheetOptions} />
                                                                    <Stack.Screen
                                                                        name="consolidation-source"
                                                                        options={fitToContentsSheetOptions(groupedSheetSurface)}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="import-column-mapper"
                                                                        options={formSheetOptions([0.75, DETENT_95])}
                                                                    />
                                                                    <Stack.Screen name="import-backup-pin" options={PIN_OPTIONS} />
                                                                    <Stack.Screen name="add-pin" options={sheetOptions} />
                                                                    <Stack.Screen
                                                                        name="transaction-type-filter"
                                                                        options={formSheetOptions([DETENT_40])}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="date-filter"
                                                                        options={formSheetOptions([DETENT_55, DETENT_85])}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-amount-filter"
                                                                        options={formSheetOptions([DETENT_82, DETENT_96])}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-category-filter"
                                                                        options={STACKED_FILTER_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-account-filter"
                                                                        options={STACKED_FILTER_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-tag-filter"
                                                                        options={STACKED_FILTER_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="budget-period-summary" options={sheetOptions} />
                                                                    <Stack.Screen name="rule-form" options={MODAL_OPTIONS} />
                                                                    <Stack.Screen name="rule-selector" options={formSheetOptions([0.75])} />
                                                                    <Stack.Screen name="rule-mcc-selector" options={SELECTOR_OPTIONS} />
                                                                </Stack>
                                                            </VoiceInputProvider>
                                                        </ModalProvider>
                                                        <AppToastHost />
                                                        <ReceiptLaunchHandler />
                                                        <BudgetNotificationLaunchHandler />
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
            </SafeAreaListener>
        </SafeAreaProvider>
    );
};
