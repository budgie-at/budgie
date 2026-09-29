import { budgetPeriodService, budgetSpentService } from '@budgie/budget';
import { AccountTypeEnum, DEFAULT_TRANSACTION_FILTER, Db, LanguageEnum, RUNWAY_WINDOW_MONTHS } from '@budgie/contracts';
import { setupI18n } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import {
    accountBalanceRepository,
    budgetCategoryLimitRepository,
    budgetRepository,
    categoryRepository,
    instrumentRepository,
    settingsRepository,
    statisticsRepository
} from '../../@generic/drizzle/db/db';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { databaseRefreshService } from '../../@generic/service/database-refresh.service';
import { Workload } from '../../@generic/service/workload.service';
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
import type { WidgetLinksInterface } from '../interface/widget-links.interface';
import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';
import type { WidgetSnapshotContextInterface } from '../interface/widget-snapshot-context.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';
import type { BudgetCategorySpentInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';
import type { I18n } from '@lingui/core';

class WidgetSnapshotService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly PUBLISH_DEBOUNCE_MS = 2_000;
    private static readonly PUBLISH_KEY = 'widget-snapshot-publish';
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

    readonly registerBackgroundTask = Effect.fn('WidgetSnapshotService.registerBackgroundTask')(function* () {
        if (Platform.OS !== 'ios' || (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(WIDGET_SNAPSHOT_TASK)))) {
            return;
        }

        yield* Effect.tryPromise(() =>
            BackgroundTask.registerTaskAsync(WIDGET_SNAPSHOT_TASK, {
                minimumInterval: WidgetSnapshotService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
            })
        );
    });

    readonly publish = Effect.fn('WidgetSnapshotService.publish')(function* (this: WidgetSnapshotService) {
        return yield* this.writeSemaphore.withPermits(1)(this.writeIfUnlocked());
    });

    readonly mask = Effect.fn('WidgetSnapshotService.mask')(function* (this: WidgetSnapshotService) {
        this.isLocked = true;
        yield* this.cancelScheduledPublish();

        return yield* this.writeSemaphore.withPermits(1)(this.write(true));
    });

    private readonly writeSemaphore = Semaphore.makeUnsafe(1);
    private isLocked = false;
    private publishedSnapshotKey = '';

    private readonly cancelScheduledPublish = Effect.fn('WidgetSnapshotService.cancelScheduledPublish')(function* () {
        const workload = yield* Workload;
        yield* workload.cancelScheduled(WidgetSnapshotService.PUBLISH_KEY);
    });

    private readonly debouncePublish = Effect.fn('WidgetSnapshotService.debouncePublish')(function* (this: WidgetSnapshotService) {
        const workload = yield* Workload;
        yield* workload.cancelScheduled(WidgetSnapshotService.PUBLISH_KEY);
        yield* workload.schedule(
            WidgetSnapshotService.PUBLISH_KEY,
            Effect.andThen(Effect.sleep(WidgetSnapshotService.PUBLISH_DEBOUNCE_MS), this.publish()).pipe(Effect.ignore)
        );
    });

    private readonly writeIfUnlocked = Effect.fn('WidgetSnapshotService.writeIfUnlocked')(function* (this: WidgetSnapshotService) {
        return !this.isLocked && (yield* this.write(false));
    });

    private readonly write = Effect.fn('WidgetSnapshotService.write')(function* (this: WidgetSnapshotService, isMaskForced: boolean) {
        const snapshot = yield* this.buildSnapshot(isMaskForced);
        const snapshotKey = JSON.stringify(snapshot);

        if (snapshotKey === this.publishedSnapshotKey) {
            return false;
        }

        this.pushToWidgets(snapshot);
        this.publishedSnapshotKey = snapshotKey;

        return true;
    });

    private readonly buildSnapshot = Effect.fn('WidgetSnapshotService.buildSnapshot')(function* (
        this: WidgetSnapshotService,
        isMaskForced: boolean
    ) {
        const settings = yield* Db.query(() => settingsRepository.findSettings());
        const instrument = settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;
        const language = settings?.language ?? LanguageEnum.EN;
        const messages = yield* Effect.promise(() => i18nLoadLanguageMessages(language));
        const context: WidgetSnapshotContextInterface = {
            i18n: setupI18n({ locale: language, messages: { [language]: messages } }),
            language,
            locale: languageToLocale(language),
            decimalPlaces: (settings?.showCents ?? true) ? DEFAULT_DECIMAL_PLACES : 0,
            isMasked: isMaskForced || (settings?.isPinEnabled ?? false)
        };
        const netWorth = yield* this.buildNetWorth(instrument, settings?.isRunwayCryptoIncluded ?? false, context);
        const budget = yield* this.buildBudget(context);
        const snapshot: WidgetSnapshotInterface = { strings: this.buildStrings(context.i18n), netWorth, budget };

        return snapshot;
    });

    private readonly buildNetWorth = Effect.fn('WidgetSnapshotService.buildNetWorth')(function* (
        this: WidgetSnapshotService,
        instrument: InstrumentEntityInterface,
        isRunwayCryptoIncluded: boolean,
        context: WidgetSnapshotContextInterface
    ) {
        const [netWorthRows, homeRows, monthRows] = yield* Effect.all(
            [
                Db.query(() => accountBalanceRepository.getNetWorth(instrument.id)),
                Db.query(() => accountBalanceRepository.getHomeAccountRows(instrument.id)),
                Db.query(() =>
                    statisticsRepository.getTotalIncomeAndExpenseQuery(
                        { ...DEFAULT_TRANSACTION_FILTER, date: { from: startOfMonth(new Date()), to: null } },
                        instrument.id
                    )
                )
            ],
            { concurrency: 'unbounded' }
        );

        if (!isNotEmptyArray(homeRows)) {
            return null;
        }

        const total = convertFromMicroUnits(netWorthRows.at(0)?.netWorth ?? 0);
        const monthlyNet = convertFromMicroUnits((monthRows.at(0)?.income ?? 0) - (monthRows.at(0)?.expense ?? 0));
        const runway = yield* this.buildRunway(instrument, isRunwayCryptoIncluded, context);
        const netWorth: WidgetNetWorthSnapshotInterface = {
            formattedTotal: this.formatWithSymbol(total, instrument.symbol, context),
            formattedDelta: this.formatDelta(monthlyNet, instrument.symbol, context),
            deltaColor: this.resolveDeltaColor(monthlyNet),
            accountTypes: this.buildAccountTypeTotals(homeRows, instrument.symbol, context),
            runway: runway ?? WidgetSnapshotService.EMPTY_NET_WORTH.runway
        };

        return netWorth;
    });

    private readonly buildBudget = Effect.fn('WidgetSnapshotService.buildBudget')(function* (
        this: WidgetSnapshotService,
        context: WidgetSnapshotContextInterface
    ) {
        const budget = yield* budgetRepository.getActive();

        if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId) || !isPositiveNumber(budget.overallLimit)) {
            return null;
        }

        const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
            budget.periodStartDay,
            budget.useLastDayOfMonth,
            new Date()
        );
        const [entries, limits, instrument] = yield* Effect.all(
            [
                Db.query(() => budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId)),
                budgetCategoryLimitRepository.getByBudget(budget.id),
                instrumentRepository.findByIdAsync(budget.instrumentId)
            ],
            { concurrency: 'unbounded' }
        );
        const spent = budgetSpentService.computeSpent(entries, budget.instrumentId);
        const symbol = instrument?.symbol ?? DEFAULT_INSTRUMENT.symbol;
        const spentAmount = convertFromMicroUnits(spent.spentOverall);
        const limitAmount = convertFromMicroUnits(budget.overallLimit);
        const periodEnd = budgetPeriodService.getInclusiveEnd(nextPeriodStart);
        const categories = yield* this.buildBudgetCategories(limits, spent.spentByCategory, context);

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
    });

    private readonly buildRunway = Effect.fn('WidgetSnapshotService.buildRunway')(function* (
        this: WidgetSnapshotService,
        instrument: InstrumentEntityInterface,
        isCryptoIncluded: boolean,
        context: WidgetSnapshotContextInterface
    ) {
        const [series, liquidRows] = yield* Effect.all(
            [
                Db.query(() => statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrument.id, RUNWAY_WINDOW_MONTHS)),
                Db.query(() => accountBalanceRepository.getLiquidTotal(instrument.id, isCryptoIncluded))
            ],
            { concurrency: 'unbounded' }
        );
        const computation = computeRunway({
            series,
            liquid: liquidRows.at(0)?.total ?? 0,
            irregularMonthlyAmount: 0,
            referenceDate: new Date()
        });

        if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
            return null;
        }

        const runway: WidgetRunwaySnapshotInterface = {
            isPositive: computation.isPositive,
            label: this.buildRunwayLabel(computation, instrument.symbol, context)
        };

        return runway;
    });

    private readonly buildBudgetCategories = Effect.fn('WidgetSnapshotService.buildBudgetCategories')(function* (
        this: WidgetSnapshotService,
        limits: BudgetCategoryLimitEntityInterface[],
        spentByCategory: readonly BudgetCategorySpentInterface[],
        context: WidgetSnapshotContextInterface
    ) {
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

        return yield* Effect.all(
            ranked.map(entry => this.buildBudgetCategory(entry.categoryId, entry.progressRatio, context)),
            { concurrency: 'unbounded' }
        );
    });

    private readonly buildBudgetCategory = Effect.fn('WidgetSnapshotService.buildBudgetCategory')(function* (
        this: WidgetSnapshotService,
        categoryId: number,
        progressRatio: number,
        context: WidgetSnapshotContextInterface
    ) {
        const [category] = yield* Db.query(() => categoryRepository.findById(categoryId, context.language));
        const budgetCategory: WidgetBudgetCategoryInterface = {
            title: isDefined(category) ? category.title : context.i18n._(msg`Category`),
            formattedProgress: this.formatPercent(progressRatio, context),
            isOverLimit: progressRatio >= 1
        };

        return budgetCategory;
    });

    start(): void {
        if (Platform.OS !== 'ios') {
            return;
        }

        databaseRefreshService.subscribe(this.schedulePublish);
        this.schedulePublish();
    }

    unlock(): void {
        this.isLocked = false;
        this.schedulePublish();
    }

    private readonly schedulePublish = (): void => {
        appRuntime.runFork(this.debouncePublish());
    };

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
