import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, LanguageEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { startOfMonth } from 'date-fns';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { canPublishWidgetSnapshot, clearWidgetSnapshot, publishWidgetSnapshot, readWidgetSnapshot } from '../../../modules/widget-bridge';
import { accountBalanceRepository, settingsRepository, statisticsRepository } from '../../@generic/drizzle/db/db';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { languageToLocale } from '../../i18n/util/language-to-locale.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';
import { dark, light } from '../../theme/provider/theme.provider';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import { WidgetDeltaDirectionEnum } from '../enum/widget-delta-direction.enum';
import { WidgetSnapshotHistorySchema } from '../schema/widget-snapshot-history.schema';

import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';
import type { WidgetThemeColorsInterface } from '../interface/widget-theme-colors.interface';
import type { WidgetSnapshotHistoryType } from '../schema/widget-snapshot-history.schema';
import type { InstrumentEntityInterface } from '@budgie/contracts';

class WidgetSnapshotService {
    private static readonly APP_VARIANT_EXTRA_KEY = 'appVariant';
    private static readonly E2E_APP_VARIANT = 'e2e';
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly PUBLISH_DEBOUNCE_MS = 2_000;
    private static readonly SNAPSHOT_VERSION = 1;
    private static readonly HISTORY_LIMIT = 30;
    private static readonly CRYPTO_ACCOUNT_TYPES = [AccountTypeEnum.CRYPTO, AccountTypeEnum.CRYPTO_SYNC];

    private isPublishing = false;
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private unsubscribeDatabaseRefresh: () => void = emptyFn;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    start(): void {
        if (this.isDisabled()) {
            return;
        }

        this.unsubscribeDatabaseRefresh = databaseRefreshService.subscribe(this.schedulePublish);
        this.schedulePublish();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    stop(): void {
        this.unsubscribeDatabaseRefresh();
        this.unsubscribeDatabaseRefresh = emptyFn;
        this.cancelScheduledPublish();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (this.isDisabled()) {
            return;
        }

        if (await TaskManager.isTaskRegisteredAsync(WIDGET_SNAPSHOT_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(WIDGET_SNAPSHOT_TASK, {
            minimumInterval: WidgetSnapshotService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log('enter', result => `done isPublished=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async publish(): Promise<boolean> {
        if (this.isDisabled() || this.isPublishing) {
            return false;
        }

        this.isPublishing = true;

        try {
            return await publishWidgetSnapshot(JSON.stringify(await this.buildSnapshot()));
        } finally {
            this.isPublishing = false;
        }
    }

    @Log('enter', result => `done isCleared=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async clear(): Promise<boolean> {
        this.cancelScheduledPublish();

        return await clearWidgetSnapshot();
    }

    private readonly schedulePublish = (): void => {
        this.cancelScheduledPublish();

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            void this.publish().catch(emptyFn);
        }, WidgetSnapshotService.PUBLISH_DEBOUNCE_MS);
    };

    private cancelScheduledPublish(): void {
        if (isDefined(this.debounceTimer)) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    private async buildSnapshot(): Promise<WidgetSnapshotInterface> {
        const settings = await settingsRepository.findSettings();
        const instrument = settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;
        const language = settings?.language ?? LanguageEnum.EN;
        const decimalPlaces = (settings?.showCents ?? true) ? DEFAULT_DECIMAL_PLACES : 0;

        return {
            version: WidgetSnapshotService.SNAPSHOT_VERSION,
            generatedAtMs: Date.now(),
            locale: languageToLocale(language),
            strings: this.buildStrings(),
            palette: this.buildPalette(),
            netWorth: await this.buildNetWorth(instrument, language, decimalPlaces)
        };
    }

    private buildStrings(): WidgetSnapshotStringsInterface {
        return {
            netWorthTitle: i18n._(msg`Net worth`),
            thisMonth: i18n._(msg`This month`),
            fiat: i18n._(msg`Cash`),
            crypto: i18n._(msg`Crypto`),
            empty: i18n._(msg`No accounts yet`)
        };
    }

    private buildPalette(): WidgetPaletteInterface {
        return { light: this.buildThemeColors(light), dark: this.buildThemeColors(dark) };
    }

    private buildThemeColors(theme: typeof light): WidgetThemeColorsInterface {
        return {
            background: this.toHexColor(theme['--color-primary-reverse']),
            primary: this.toHexColor(theme['--color-primary']),
            secondary: this.toHexColor(theme['--color-secondary-foreground']),
            positive: this.toHexColor(theme['--color-positive-foreground']),
            destructive: this.toHexColor(theme['--color-destructive-foreground'])
        };
    }

    private toHexColor(value: string): string {
        const channels = /(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/u.exec(value);

        if (!isDefined(channels)) {
            return '#000000';
        }

        return `#${channels
            .slice(1, 4)
            .map(channel => Math.round(Number(channel)).toString(16).padStart(2, '0'))
            .join('')}`;
    }

    private async buildNetWorth(
        instrument: InstrumentEntityInterface,
        language: LanguageEnum,
        decimalPlaces: number
    ): Promise<WidgetNetWorthSnapshotInterface | null> {
        const [netWorthRows, homeRows, monthRows] = await Promise.all([
            accountBalanceRepository.getNetWorth(instrument.id),
            accountBalanceRepository.getHomeAccountRows(instrument.id),
            statisticsRepository.getTotalIncomeAndExpenseQuery(
                { ...DEFAULT_TRANSACTION_FILTER, date: { from: startOfMonth(new Date()), to: null } },
                instrument.id
            )
        ]);

        if (!isNotEmptyArray(homeRows)) {
            return null;
        }

        const total = convertFromMicroUnits(netWorthRows.at(0)?.netWorth ?? 0);
        const cryptoTotal = this.sumConvertedBalance(homeRows, true);
        const monthlyNet = convertFromMicroUnits((monthRows.at(0)?.income ?? 0) - (monthRows.at(0)?.expense ?? 0));

        return {
            formattedTotal: this.formatAmount(total, instrument, language, decimalPlaces),
            formattedDelta: this.formatDelta(monthlyNet, instrument, language, decimalPlaces),
            deltaDirection: this.resolveDeltaDirection(monthlyNet),
            formattedFiat: this.formatAmount(total - cryptoTotal, instrument, language, decimalPlaces),
            formattedCrypto: this.formatAmount(cryptoTotal, instrument, language, decimalPlaces),
            hasCrypto: cryptoTotal !== 0,
            history: await this.buildHistory(total)
        };
    }

    private sumConvertedBalance(rows: Awaited<ReturnType<typeof accountBalanceRepository.getHomeAccountRows>>, isCrypto: boolean): number {
        return rows
            .filter(
                row =>
                    row.account.includeInNetWorth &&
                    row.account.isActive &&
                    WidgetSnapshotService.CRYPTO_ACCOUNT_TYPES.includes(row.account.type) === isCrypto
            )
            .reduce((total, row) => total + convertFromMicroUnits(row.convertedBalance), 0);
    }

    private async buildHistory(total: number): Promise<readonly number[]> {
        const previous = await this.readPreviousSnapshot();
        const history = [...(previous?.netWorth?.history ?? [])];
        const isSameDay =
            isDefined(previous) &&
            new Date(previous.generatedAtMs).toDateString() === new Date().toDateString() &&
            isNotEmptyArray(history);

        if (isSameDay) {
            history[history.length - 1] = total;
        } else {
            history.push(total);
        }

        return history.slice(-WidgetSnapshotService.HISTORY_LIMIT);
    }

    private async readPreviousSnapshot(): Promise<WidgetSnapshotHistoryType | null> {
        const raw = await readWidgetSnapshot();

        if (!isDefined(raw)) {
            return null;
        }

        try {
            const parsed = WidgetSnapshotHistorySchema.safeParse(JSON.parse(raw));

            return parsed.success ? parsed.data : null;
        } catch {
            return null;
        }
    }

    private formatAmount(value: number, instrument: InstrumentEntityInterface, language: LanguageEnum, decimalPlaces: number): string {
        return `${instrument.symbol}${new Intl.NumberFormat(languageToLocale(language), {
            style: 'decimal',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        }).format(value)}`;
    }

    private formatDelta(value: number, instrument: InstrumentEntityInterface, language: LanguageEnum, decimalPlaces: number): string {
        return `${this.resolveDeltaPrefix(value)}${this.formatAmount(Math.abs(value), instrument, language, decimalPlaces)}`;
    }

    private resolveDeltaPrefix(value: number): string {
        if (value > 0) {
            return '+';
        }

        return value < 0 ? '-' : '';
    }

    private resolveDeltaDirection(value: number): WidgetDeltaDirectionEnum {
        if (value > 0) {
            return WidgetDeltaDirectionEnum.UP;
        }

        return value < 0 ? WidgetDeltaDirectionEnum.DOWN : WidgetDeltaDirectionEnum.FLAT;
    }

    private isDisabled(): boolean {
        return this.isE2EApp() || !canPublishWidgetSnapshot();
    }

    private isE2EApp(): boolean {
        return Constants.expoConfig?.extra?.[WidgetSnapshotService.APP_VARIANT_EXTRA_KEY] === WidgetSnapshotService.E2E_APP_VARIANT;
    }
}

export const widgetSnapshotService = new WidgetSnapshotService();
