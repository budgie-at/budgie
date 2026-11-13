import { logAndContinue } from '@budgie/contracts';
/* eslint-disable react/jsx-max-depth */
import { BudgetPeriodCloseService } from '@budgie/budget';
import { I18nProvider as LinguiProvider } from '@lingui/react';
import * as DateTime from 'effect/DateTime';
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
import { NotificationLaunchHandler } from '../@generic/component/notification-launch-handler/notification-launch-handler';
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
import { AiProvider } from '../ai/provider/ai.provider';
import { VoiceInputProvider } from '../ai/provider/voice-input.provider';
import { AuthGuard } from '../auth/provider/auth.guard';
import { AuthProvider } from '../auth/provider/auth.provider';
import { IS_CLOUD_BACKUP_SUPPORTED } from '../cloud-backup/constant/is-cloud-backup-supported.constant';
import { CloudSyncLineagePrompt } from '../cloud-sync/component/cloud-sync-lineage-prompt/cloud-sync-lineage-prompt';
import { HouseholdJoinNavigator } from '../household/component/household-join-navigator/household-join-navigator';
import { I18nProvider } from '../i18n/provider/i18n.provider';
import { HistoricalMarketDataDrainerService } from '../market-data/service/historical-market-data-drainer.service';
import { ReceiptLaunchHandler } from '../receipt/components/receipt-launch-handler/receipt-launch-handler';
import { AppDataSyncService } from '../sync/service/app-data-sync.service';
import { ThemeProvider } from '../theme/provider/theme.provider';

const MODAL_OPTIONS: NativeStackNavigationOptions = { presentation: 'modal', headerShown: false };

const ENTITY_FORM_OPTIONS: NativeStackNavigationOptions = { presentation: 'fullScreenModal', headerShown: false };

const PIN_OPTIONS: NativeStackNavigationOptions = { ...MODAL_OPTIONS, gestureEnabled: false };

const LOCK_SCREEN_OPTIONS: NativeStackNavigationOptions = { presentation: 'fullScreenModal', animation: 'none' };

const FADE_OPTIONS: NativeStackNavigationOptions = { animation: 'fade' };

const MORPHING_SHEET_OPTIONS: NativeStackNavigationOptions = {
    presentation: 'transparentModal',
    animation: 'none',
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' }
};

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
                            yield* historicalMarketDataDrainerService.enqueueActiveAccounts().pipe(logAndContinue, Effect.forkDetach);
                        }
                    })
                )
            );
            const now = yield* DateTime.nowAsDate;
            yield* logAndContinue(workload.run(budgetPeriodCloseService.closeDuePeriods(now)));
        })
    );
};

// eslint-disable-next-line max-lines-per-function -- Layout component requires many lines
export const RootLayoutContent = () => {
    const databaseMigrationStatus = useDatabaseMigration();
    const [sheetSurface] = useCSSVariable(['--color-sheet-surface']);
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
                                                                    <Stack.Screen name="(tabs)" options={FADE_OPTIONS} />
                                                                    <Stack.Screen name="onboarding" options={FADE_OPTIONS} />
                                                                    <Stack.Screen name="(main)/pin" options={LOCK_SCREEN_OPTIONS} />
                                                                    <Stack.Screen name="(main)/create-account" />
                                                                    <Stack.Screen name="(main)/account/[id]/details" />
                                                                    <Stack.Screen name="(main)/institution/[id]" />
                                                                    <Stack.Screen name="(main)/inzhur/purchase" />
                                                                    <Stack.Screen name="(main)/account/[id]/update" />
                                                                    <Stack.Screen name="(main)/currency/[id]" />
                                                                    <Stack.Screen name="(main)/passive-income" />
                                                                    <Stack.Screen name="(main)/create-transaction/expense" />
                                                                    <Stack.Screen name="(main)/create-transaction/income" />
                                                                    <Stack.Screen name="(main)/create-transaction/transfer" />
                                                                    <Stack.Screen name="(main)/matching-rules" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/expense" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/income" />
                                                                    <Stack.Screen name="(main)/transactions/[id]/transfer" />
                                                                    <Stack.Screen name="(main)/analytics/transactions" />
                                                                    <Stack.Screen name="(main)/categorize" />
                                                                    <Stack.Screen
                                                                        name="category-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="account-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="yield-kind" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="currency-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="language-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="resync-window-picker"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="deposit-close" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="contact-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="tags-selector" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="category-destination"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="tag-destination" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen name="voice-review" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="budget-safe-to-spend"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="passive-income-info"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="budget-limit-changes"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="category-form" options={ENTITY_FORM_OPTIONS} />
                                                                    <Stack.Screen name="tag-form" options={ENTITY_FORM_OPTIONS} />
                                                                    <Stack.Screen name="date-picker" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="bank-integration-key"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="convert-to-transfer"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="convert-to-installment"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="convert-to-refund"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="icon-selector" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen name="split-entries" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen name="transaction-fee" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="consolidation-source"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="make-recurring" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="import-column-mapper"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="import-backup-pin" options={PIN_OPTIONS} />
                                                                    <Stack.Screen name="pin-setup" />
                                                                    <Stack.Screen name="add-pin" options={sheetOptions} />
                                                                    <Stack.Screen
                                                                        name="transaction-type-filter"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="date-filter" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="transaction-amount-filter"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-category-filter"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-account-filter"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="transaction-tag-filter"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen
                                                                        name="budget-period-summary"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                    <Stack.Screen name="rule-form" />
                                                                    <Stack.Screen name="rule-selector" options={MORPHING_SHEET_OPTIONS} />
                                                                    <Stack.Screen
                                                                        name="rule-mcc-selector"
                                                                        options={MORPHING_SHEET_OPTIONS}
                                                                    />
                                                                </Stack>
                                                            </VoiceInputProvider>
                                                        </ModalProvider>
                                                        <AppToastHost />
                                                        <ReceiptLaunchHandler />
                                                        <NotificationLaunchHandler />
                                                        {IS_CLOUD_BACKUP_SUPPORTED ? <CloudSyncLineagePrompt /> : null}
                                                        {IS_CLOUD_BACKUP_SUPPORTED ? <HouseholdJoinNavigator /> : null}
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
