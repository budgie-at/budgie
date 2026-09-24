import { budgetPeriodService, budgetSpentService } from '@budgie/budget';
import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, LanguageEnum, RUNWAY_WINDOW_MONTHS } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { setupI18n } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    budgetCategoryLimitRepository,
    budgetRepository,
    categoryRepository,
    instrumentRepository,
    settingsRepository,
    statisticsRepository
} from '../../@generic/drizzle/db/db';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_TYPE } from '../../account/constant/account-type.constant';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { i18nLoadLanguageMessages } from '../../i18n/util/i18n.util';
import { languageToLocale } from '../../i18n/util/language-to-locale.util';
import { RUNWAY_MINIMUM_MONTHS } from '../../runway/constant/runway-minimum-months.constant';
import { computeRunway } from '../../runway/utils/compute-runway.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';
import { WIDGET_SNAPSHOT_TASK } from '../constant/widget-snapshot-task.constant';
import BudgetWidget from '../widget/budget.widget';
import NetWorthWidget from '../widget/net-worth.widget';
import QuickAddWidget from '../widget/quick-add.widget';

import type { WidgetAccountTypeTotalInterface } from '../interface/widget-account-type-total.interface';
import type { WidgetBudgetCategoryInterface } from '../interface/widget-budget-category.interface';
import type { WidgetBudgetSnapshotInterface } from '../interface/widget-budget-snapshot.interface';
import type { WidgetBudgetTimelineEntryInterface } from '../interface/widget-budget-timeline-entry.interface';
import type { WidgetLinksInterface } from '../interface/widget-links.interface';
import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';
import type { WidgetSnapshotContextInterface } from '../interface/widget-snapshot-context.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';
import type { BudgetCategorySpentInterface } from '@budgie/budget';
import type { InstrumentEntityInterface } from '@budgie/contracts';
import type { I18n } from '@lingui/core';

class WidgetSnapshotService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly PUBLISH_DEBOUNCE_MS = 2_000;
    private static readonly BUDGET_URL = 'budgie://budget';
    private static readonly LINKS: WidgetLinksInterface = {
        expenseUrl: 'budgie://create-transaction/expense',
        incomeUrl: 'budgie://create-transaction/income',
        transferUrl: 'budgie://create-transaction/transfer',
        homeUrl: 'budgie://'
    };

    private static readonly EMPTY_NET_WORTH: WidgetNetWorthSnapshotInterface = {
        formattedTotal: '',
        formattedDelta: '',
        deltaColor: 'secondary',
        accountTypes: [],
        runway: { isPositive: true, label: '' }
    };

    private static readonly EMPTY_BUDGET: WidgetBudgetSnapshotInterface = {
        formattedSpent: '',
        formattedLimit: '',
        formattedRemaining: '',
        progressRatio: 0,
        formattedProgress: '',
        isOverLimit: false,
        formattedDaysLeft: '',
        formattedSafePerDay: '',
        categories: []
    };

    private static readonly TOP_CATEGORY_COUNT = 3;
    private static readonly TOP_ACCOUNT_TYPE_COUNT = 4;
    private static readonly MASKED_AMOUNT = '•••';

    private pendingWrite: Promise<unknown> = Promise.resolve();
    private isLocked = false;
    private publishedSnapshotKey = '';
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    start(): void {
        if (Platform.OS !== 'ios') {
            return;
        }

        databaseRefreshService.subscribe(this.schedulePublish);
        this.schedulePublish();
    }

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (Platform.OS !== 'ios' || (await TaskManager.isTaskRegisteredAsync(WIDGET_SNAPSHOT_TASK))) {
            return;
        }

        await BackgroundTask.registerTaskAsync(WIDGET_SNAPSHOT_TASK, {
            minimumInterval: WidgetSnapshotService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log('enter', result => `done isPublished=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async publish(): Promise<boolean> {
        return await this.enqueue(async () => !this.isLocked && (await this.write(false)));
    }

    @Log('enter', result => `done isMasked=${result}`, error => `throw error=${getErrorMessage(error)}`)
    async mask(): Promise<boolean> {
        this.isLocked = true;
        this.cancelScheduledPublish();

        return await this.enqueue(async () => await this.write(true));
    }

    private async enqueue(task: () => Promise<boolean>): Promise<boolean> {
        const run = this.pendingWrite.then(task);

        this.pendingWrite = run.catch(emptyFn);

        return await run;
    }

    private async write(isMaskForced: boolean): Promise<boolean> {
        const snapshot = await this.buildSnapshot(isMaskForced);
        const snapshotKey = JSON.stringify(snapshot);

        if (snapshotKey === this.publishedSnapshotKey) {
            return false;
        }

        this.pushToWidgets(snapshot);
        this.publishedSnapshotKey = snapshotKey;

        return true;
    }

    private pushToWidgets(snapshot: WidgetSnapshotInterface): void {
        NetWorthWidget.updateSnapshot({
            isEmpty: !isDefined(snapshot.netWorth),
            netWorth: snapshot.netWorth ?? WidgetSnapshotService.EMPTY_NET_WORTH,
            strings: snapshot.strings,
            homeUrl: WidgetSnapshotService.LINKS.homeUrl
        });

        if (isDefined(snapshot.budget)) {
            BudgetWidget.updateTimeline(
                snapshot.budget.map(entry => ({
                    date: entry.date,
                    props: { isEmpty: false, budget: entry.budget, strings: snapshot.strings, budgetUrl: WidgetSnapshotService.BUDGET_URL }
                }))
            );
        } else {
            BudgetWidget.updateSnapshot({
                isEmpty: true,
                budget: WidgetSnapshotService.EMPTY_BUDGET,
                strings: snapshot.strings,
                budgetUrl: WidgetSnapshotService.BUDGET_URL
            });
        }

        QuickAddWidget.updateSnapshot({ strings: snapshot.strings, links: WidgetSnapshotService.LINKS });
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

    private async buildSnapshot(isMaskForced: boolean): Promise<WidgetSnapshotInterface> {
        const settings = await settingsRepository.findSettings();
        const instrument = settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;
        const language = settings?.language ?? LanguageEnum.EN;
        const context: WidgetSnapshotContextInterface = {
            i18n: setupI18n({ locale: language, messages: { [language]: await i18nLoadLanguageMessages(language) } }),
            language,
            locale: languageToLocale(language),
            decimalPlaces: (settings?.showCents ?? true) ? DEFAULT_DECIMAL_PLACES : 0,
            isMasked: isMaskForced || (settings?.isPinEnabled ?? false)
        };

        return {
            strings: this.buildStrings(context.i18n),
            netWorth: await this.buildNetWorth(instrument, settings?.isRunwayCryptoIncluded ?? false, context),
            budget: await this.buildBudget(context)
        };
    }

    private buildStrings(i18n: I18n): WidgetSnapshotStringsInterface {
        return {
            netWorthTitle: i18n._(msg`Net worth`),
            thisMonth: i18n._(msg`This month`),
            budgetTitle: i18n._(msg`Budget`),
            perDay: i18n._(msg`per day`),
            left: i18n._(msg`left`),
            over: i18n._(msg`over`),
            noBudget: i18n._(msg`No active budget`),
            expense: i18n._(msg`Expense`),
            income: i18n._(msg`Income`),
            transfer: i18n._(msg`Transfer`),
            empty: i18n._(msg`Open Budgie to see your finances`)
        };
    }

    private async buildNetWorth(
        instrument: InstrumentEntityInterface,
        isRunwayCryptoIncluded: boolean,
        context: WidgetSnapshotContextInterface
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
        const monthlyNet = convertFromMicroUnits((monthRows.at(0)?.income ?? 0) - (monthRows.at(0)?.expense ?? 0));

        return {
            formattedTotal: this.formatWithSymbol(total, instrument.symbol, context),
            formattedDelta: this.formatDelta(monthlyNet, instrument.symbol, context),
            deltaColor: this.resolveDeltaColor(monthlyNet),
            accountTypes: this.buildAccountTypeTotals(homeRows, instrument.symbol, context),
            runway: (await this.buildRunway(instrument, isRunwayCryptoIncluded, context)) ?? WidgetSnapshotService.EMPTY_NET_WORTH.runway
        };
    }

    private buildAccountTypeTotals(
        rows: Awaited<ReturnType<typeof accountBalanceRepository.getHomeAccountRows>>,
        symbol: string,
        context: WidgetSnapshotContextInterface
    ): readonly WidgetAccountTypeTotalInterface[] {
        const totals = new Map<AccountTypeEnum, number>();

        rows.filter(row => row.account.includeInNetWorth).forEach(row => {
            totals.set(row.account.type, (totals.get(row.account.type) ?? 0) + convertFromMicroUnits(row.convertedBalance));
        });

        return [...totals.entries()]
            .filter(([, amount]) => amount !== 0)
            .sort(([, first], [, second]) => Math.abs(second) - Math.abs(first))
            .slice(0, WidgetSnapshotService.TOP_ACCOUNT_TYPE_COUNT)
            .map(([type, amount]) => ({
                label: context.i18n._(ACCOUNT_TYPE[type]),
                formattedTotal: this.formatWithSymbol(amount, symbol, context)
            }));
    }

    private async buildBudget(context: WidgetSnapshotContextInterface): Promise<readonly WidgetBudgetTimelineEntryInterface[] | null> {
        const budget = await budgetRepository.getActive();

        if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId) || !isPositiveNumber(budget.overallLimit)) {
            return null;
        }

        const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
            budget.periodStartDay,
            budget.useLastDayOfMonth,
            new Date()
        );
        const [entries, limits, instrument] = await Promise.all([
            budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId),
            budgetCategoryLimitRepository.getByBudget(budget.id),
            instrumentRepository.findByIdAsync(budget.instrumentId)
        ]);
        const spent = budgetSpentService.computeSpent(entries, budget.instrumentId);
        const symbol = instrument?.symbol ?? DEFAULT_INSTRUMENT.symbol;
        const spentAmount = convertFromMicroUnits(spent.spentOverall);
        const limitAmount = convertFromMicroUnits(budget.overallLimit);
        const periodEnd = budgetPeriodService.getInclusiveEnd(nextPeriodStart);
        const categories = await this.buildBudgetCategories(limits, spent.spentByCategory, context);

        return Array.from({ length: Math.max(differenceInCalendarDays(periodEnd, new Date()) + 1, 1) }, (_entry, index) => {
            const daysRemaining = index + 1;

            return {
                date: startOfDay(addDays(periodEnd, -index)),
                budget: {
                    formattedSpent: this.formatWithSymbol(spentAmount, symbol, context),
                    formattedLimit: this.formatWithSymbol(limitAmount, symbol, context),
                    formattedRemaining: this.formatWithSymbol(Math.abs(limitAmount - spentAmount), symbol, context),
                    progressRatio: spentAmount / limitAmount,
                    formattedProgress: this.formatPercent(spentAmount / limitAmount, context),
                    isOverLimit: spentAmount > limitAmount,
                    formattedDaysLeft: context.i18n._(msg({ message: plural(daysRemaining, { one: '# day left', other: '# days left' }) })),
                    formattedSafePerDay: this.formatWithSymbol(Math.max(limitAmount - spentAmount, 0) / daysRemaining, symbol, context),
                    categories
                }
            };
        }).reverse();
    }

    private async buildRunway(
        instrument: InstrumentEntityInterface,
        isCryptoIncluded: boolean,
        context: WidgetSnapshotContextInterface
    ): Promise<WidgetRunwaySnapshotInterface | null> {
        const [series, liquidRows] = await Promise.all([
            statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrument.id, RUNWAY_WINDOW_MONTHS),
            accountBalanceRepository.getLiquidTotal(instrument.id, isCryptoIncluded)
        ]);
        const computation = computeRunway({
            series,
            liquid: liquidRows.at(0)?.total ?? 0,
            irregularMonthlyAmount: 0,
            referenceDate: new Date()
        });

        if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
            return null;
        }

        return { isPositive: computation.isPositive, label: this.buildRunwayLabel(computation, instrument.symbol, context) };
    }

    private buildRunwayLabel(
        computation: ReturnType<typeof computeRunway>,
        symbol: string,
        context: WidgetSnapshotContextInterface
    ): string {
        if (context.isMasked) {
            return WidgetSnapshotService.MASKED_AMOUNT;
        }

        if (computation.isPositive) {
            const formattedNet = this.formatWithSymbol(convertFromMicroUnits(computation.net), symbol, { ...context, decimalPlaces: 0 });

            return context.i18n._(msg`+${formattedNet} / mo`);
        }

        const formattedMonths = new Intl.NumberFormat(context.locale).format(Math.round(computation.runwayMonths ?? 0));

        return context.i18n._(msg`≈ ${formattedMonths} mo`);
    }

    private async buildBudgetCategories(
        limits: Awaited<ReturnType<typeof budgetCategoryLimitRepository.getByBudget>>,
        spentByCategory: readonly BudgetCategorySpentInterface[],
        context: WidgetSnapshotContextInterface
    ): Promise<readonly WidgetBudgetCategoryInterface[]> {
        const ranked = limits
            .filter(limit => isPositiveNumber(limit.limitAmount))
            .map(limit => ({
                categoryId: limit.categoryId,
                progressRatio:
                    convertFromMicroUnits(spentByCategory.find(entry => entry.categoryId === limit.categoryId)?.spent ?? 0) /
                    convertFromMicroUnits(limit.limitAmount)
            }))
            .sort((first, second) => second.progressRatio - first.progressRatio)
            .slice(0, WidgetSnapshotService.TOP_CATEGORY_COUNT);

        return await Promise.all(ranked.map(entry => this.buildBudgetCategory(entry.categoryId, entry.progressRatio, context)));
    }

    private async buildBudgetCategory(
        categoryId: number,
        progressRatio: number,
        context: WidgetSnapshotContextInterface
    ): Promise<WidgetBudgetCategoryInterface> {
        const [category] = await categoryRepository.findById(categoryId, context.language);

        return {
            title: isDefined(category) ? category.title : context.i18n._(msg`Category`),
            formattedProgress: this.formatPercent(progressRatio, context),
            isOverLimit: progressRatio >= 1
        };
    }

    private formatPercent(ratio: number, context: WidgetSnapshotContextInterface): string {
        return new Intl.NumberFormat(context.locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
    }

    private formatWithSymbol(value: number, symbol: string, context: WidgetSnapshotContextInterface): string {
        if (context.isMasked) {
            return WidgetSnapshotService.MASKED_AMOUNT;
        }

        return `${symbol}${new Intl.NumberFormat(context.locale, {
            style: 'decimal',
            minimumFractionDigits: context.decimalPlaces,
            maximumFractionDigits: context.decimalPlaces
        }).format(value)}`;
    }

    private formatDelta(value: number, symbol: string, context: WidgetSnapshotContextInterface): string {
        if (context.isMasked) {
            return WidgetSnapshotService.MASKED_AMOUNT;
        }

        return `${this.resolveDeltaPrefix(value)}${this.formatWithSymbol(Math.abs(value), symbol, context)}`;
    }

    private resolveDeltaPrefix(value: number): string {
        if (value > 0) {
            return '+';
        }

        return value < 0 ? '-' : '';
    }

    private resolveDeltaColor(value: number): string {
        if (value > 0) {
            return 'green';
        }

        return value < 0 ? 'red' : 'secondary';
    }
}

export const widgetSnapshotService = new WidgetSnapshotService();
