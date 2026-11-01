import { BudgetPaceStatusEnum, BudgetRepository, computePeriodWindow, computeSafePerDay, getInclusiveEnd } from '@budgie/budget';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CategoryRepository,
    DEFAULT_TRANSACTION_FILTER,
    InstrumentRepository,
    LanguageEnum,
    RUNWAY_WINDOW_MONTHS,
    RunwayDriverDimensionEnum,
    SettingsRepository,
    StatisticsRepository,
    convertFromMicroUnits
} from '@budgie/contracts';
import { setupI18n } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { ACCOUNT_TYPE } from '../../account/constant/account-type.constant';
import { BUDGET_PACE_STATUS_LABEL } from '../../budget/constant/budget-pace-status-label.constant';
import { BUDGET_PACE_VARIANT } from '../../budget/constant/budget-pace-variant.constant';
import { BudgetProjectionService } from '../../budget/service/budget-projection.service';
import { resolveBudgetBarTone } from '../../budget/utils/resolve-budget-bar-tone.util';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { formatSymbolAmount } from '../../i18n/utils/format-symbol-amount.util';
import { i18nLoadLanguageMessages } from '../../i18n/utils/i18n.util';
import { languageToLocale } from '../../i18n/utils/language-to-locale.util';
import { RUNWAY_MINIMUM_MONTHS } from '../../runway/constant/runway-minimum-months.constant';
import { aggregateRunwayDrivers } from '../../runway/utils/aggregate-runway-drivers.util';
import { computeRunway } from '../../runway/utils/compute-runway.util';
import { fillRunwaySeriesMonths } from '../../runway/utils/fill-runway-series-months.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';

import type { WidgetAccountTypeTotalInterface } from '../interface/widget-account-type-total.interface';
import type { WidgetBudgetCategoryInterface } from '../interface/widget-budget-category.interface';
import type { WidgetBudgetStatInterface } from '../interface/widget-budget-stat.interface';
import type { WidgetBudgetStatsInputInterface } from '../interface/widget-budget-stats-input.interface';
import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';
import type { WidgetSnapshotContextInterface } from '../interface/widget-snapshot-context.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';
import type { BudgetCategoryProjectionInterface } from '@budgie/budget';
import type { InstrumentEntityInterface } from '@budgie/contracts';
import type { I18n } from '@lingui/core';

export class WidgetSnapshotBuilderService extends Context.Service<WidgetSnapshotBuilderService>()(
    '@budgie/app/WidgetSnapshotBuilderService',
    {
        make: Effect.gen(function* () {
            const settingsRepository = yield* SettingsRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const statisticsRepository = yield* StatisticsRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const categoryRepository = yield* CategoryRepository;
            const budgetRepository = yield* BudgetRepository;
            const budgetProjectionService = yield* BudgetProjectionService;
            const emptyRunway: WidgetRunwaySnapshotInterface = { isPositive: true, label: '' };
            const topCategoryCount = 3;
            const topAccountTypeCount = 4;
            const maskedAmount = '•••';
            const compactAmountThreshold = 100;
            const abbreviatedAmountThreshold = 100_000;
            const categoryTone = { green: 'positive', yellow: 'warning', red: 'destructive' } as const;

            const formatPercent = (ratio: number, context: WidgetSnapshotContextInterface): string =>
                new Intl.NumberFormat(context.locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);

            const formatWithSymbol = (value: number, symbol: string, context: WidgetSnapshotContextInterface): string => {
                if (context.isMasked) {
                    return maskedAmount;
                }

                return formatSymbolAmount(value, symbol, absolute =>
                    new Intl.NumberFormat(context.locale, {
                        style: 'decimal',
                        minimumFractionDigits: context.decimalPlaces,
                        maximumFractionDigits: context.decimalPlaces
                    }).format(absolute)
                );
            };

            const resolveDeltaPrefix = (value: number): string => {
                if (value > 0) {
                    return '+';
                }

                return value < 0 ? '-' : '';
            };

            const resolveDeltaColor = (value: number): string => {
                if (value > 0) {
                    return 'green';
                }

                return value < 0 ? 'red' : 'secondary';
            };

            const formatDelta = (value: number, symbol: string, context: WidgetSnapshotContextInterface): string => {
                if (context.isMasked) {
                    return maskedAmount;
                }

                return `${resolveDeltaPrefix(value)}${formatWithSymbol(Math.abs(value), symbol, context)}`;
            };

            const formatCompactWithSymbol = (value: number, symbol: string, context: WidgetSnapshotContextInterface): string => {
                if (context.isMasked || Math.abs(value) < abbreviatedAmountThreshold) {
                    return formatWithSymbol(
                        value,
                        symbol,
                        Math.abs(value) >= compactAmountThreshold ? { ...context, decimalPlaces: 0 } : context
                    );
                }

                return formatSymbolAmount(value, symbol, absolute =>
                    new Intl.NumberFormat(context.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(absolute)
                );
            };

            const buildStrings = (i18n: I18n): WidgetSnapshotStringsInterface => ({
                netWorthTitle: i18n._(msg`Net worth`),
                thisMonth: i18n._(msg`This month`),
                categoriesTitle: i18n._(msg`Category limits`),
                today: i18n._(msg`Today`),
                limit: i18n._(msg`Limit`),
                emptyBudgetTitle: i18n._(msg`Know what’s safe to spend`),
                emptyBudgetSubtitle: i18n._(msg`Set a limit and get a daily allowance`),
                emptyBudgetAction: i18n._(msg`Set budget`),
                expense: i18n._(msg`Expense`),
                income: i18n._(msg`Income`),
                transfer: i18n._(msg`Transfer`),
                scan: i18n._(msg`Scan`),
                empty: i18n._(msg`Open Budgie to see your finances`)
            });

            const buildAccountTypeTotals = (
                rows: Effect.Success<ReturnType<typeof accountBalanceRepository.getHomeAccountRows>>,
                symbol: string,
                context: WidgetSnapshotContextInterface
            ): readonly WidgetAccountTypeTotalInterface[] => {
                const totals = new Map<AccountTypeEnum, number>();

                rows.filter(row => row.account.includeInNetWorth).forEach(row => {
                    totals.set(row.account.type, (totals.get(row.account.type) ?? 0) + convertFromMicroUnits(row.convertedBalance));
                });

                return [...totals.entries()]
                    .filter(([, amount]) => amount !== 0)
                    .sort(([, first], [, second]) => Math.abs(second) - Math.abs(first))
                    .slice(0, topAccountTypeCount)
                    .map(([type, amount]) => ({
                        label: context.i18n._(ACCOUNT_TYPE[type]),
                        formattedTotal: formatWithSymbol(amount, symbol, context)
                    }));
            };

            const buildRunwayLabel = (
                computation: ReturnType<typeof computeRunway>,
                symbol: string,
                context: WidgetSnapshotContextInterface
            ): string => {
                if (context.isMasked) {
                    return maskedAmount;
                }

                if (computation.isPositive) {
                    const formattedNet = formatWithSymbol(convertFromMicroUnits(computation.net), symbol, { ...context, decimalPlaces: 0 });

                    return context.i18n._(msg`+${formattedNet} / mo`);
                }

                const formattedMonths = new Intl.NumberFormat(context.locale).format(Math.round(computation.runwayMonths ?? 0));

                return context.i18n._(msg`≈ ${formattedMonths} mo`);
            };

            const buildBudgetCategory = Effect.fn('WidgetSnapshotBuilderService.buildBudgetCategory')(function* (
                categoryId: number,
                progressRatio: number,
                context: WidgetSnapshotContextInterface
            ) {
                const categories = yield* categoryRepository.findById(categoryId, context.language);
                const category = categories.at(0);
                const budgetCategory: WidgetBudgetCategoryInterface = {
                    title: isDefined(category) ? category.title : context.i18n._(msg`Category`),
                    formattedProgress: formatPercent(progressRatio, context),
                    ratio: Math.min(Math.max(progressRatio, 0), 1),
                    limitRatio: progressRatio > 1 ? 1 / progressRatio : null,
                    tone: categoryTone[resolveBudgetBarTone(progressRatio)]
                };

                return budgetCategory;
            });

            const buildBudgetCategories = Effect.fn('WidgetSnapshotBuilderService.buildBudgetCategories')(function* (
                categoryProjections: readonly BudgetCategoryProjectionInterface[],
                context: WidgetSnapshotContextInterface
            ) {
                const ranked = categoryProjections
                    .filter(category => isPositiveNumber(category.limit))
                    .map(category => ({
                        categoryId: category.categoryId,
                        spent: category.spent,
                        progressRatio: convertFromMicroUnits(category.spent) / convertFromMicroUnits(category.limit)
                    }))
                    .sort((first, second) => second.progressRatio - first.progressRatio || second.spent - first.spent)
                    .slice(0, topCategoryCount);

                return yield* Effect.all(
                    ranked.map(entry => buildBudgetCategory(entry.categoryId, entry.progressRatio, context)),
                    { concurrency: 'unbounded' }
                );
            });

            const formatPeriod = (start: Date, end: Date, context: WidgetSnapshotContextInterface): string => {
                const formatter = new Intl.DateTimeFormat(context.locale, { month: 'short', day: 'numeric' });

                return `${formatter.format(start)} – ${formatter.format(end)}`;
            };

            const formatHiddenCategories = (count: number, context: WidgetSnapshotContextInterface): string =>
                isPositiveNumber(count) ? context.i18n._(msg({ message: plural(count, { one: '+# more', other: '+# more' }) })) : '';

            const buildBudgetCaption = (isOverLimit: boolean, formattedLimit: string, context: WidgetSnapshotContextInterface): string => {
                if (context.isMasked) {
                    return context.i18n._(msg`Unlock to view`);
                }

                return isOverLimit ? context.i18n._(msg`above ${formattedLimit} limit`) : context.i18n._(msg`left of ${formattedLimit}`);
            };

            const buildBudgetStats = (
                input: WidgetBudgetStatsInputInterface,
                context: WidgetSnapshotContextInterface
            ): readonly WidgetBudgetStatInterface[] => {
                const formattedAveragePerDay = formatCompactWithSymbol(
                    input.spentAmount / Math.max(input.elapsedDays, 1),
                    input.symbol,
                    context
                );
                const averageStat: WidgetBudgetStatInterface = {
                    label: context.i18n._(msg`Average spend`),
                    value: context.i18n._(msg`${formattedAveragePerDay} a day`),
                    note: null,
                    isNoteNegative: false
                };

                if (!isDefined(input.projectedAmount)) {
                    return [averageStat];
                }

                const formattedDifference = formatCompactWithSymbol(
                    Math.abs(input.limitAmount - input.projectedAmount),
                    input.symbol,
                    context
                );
                const isProjectedOver = input.projectedAmount > input.limitAmount;

                return [
                    {
                        label: context.i18n._(msg`Projected spend`),
                        value: formatCompactWithSymbol(input.projectedAmount, input.symbol, context),
                        note: isProjectedOver
                            ? context.i18n._(msg`${formattedDifference} over limit`)
                            : context.i18n._(msg`${formattedDifference} under limit`),
                        isNoteNegative: isProjectedOver
                    },
                    averageStat
                ];
            };

            const buildRunway = Effect.fn('WidgetSnapshotBuilderService.buildRunway')(function* (
                instrument: InstrumentEntityInterface,
                isCryptoIncluded: boolean,
                context: WidgetSnapshotContextInterface
            ) {
                const [seriesRows, driverRows, liquidRows] = yield* Effect.all(
                    [
                        statisticsRepository.getRunwaySeriesQuery(
                            DEFAULT_TRANSACTION_FILTER,
                            instrument.id,
                            RUNWAY_WINDOW_MONTHS,
                            isCryptoIncluded
                        ),
                        statisticsRepository.getRunwayDriverSeriesQuery(
                            DEFAULT_TRANSACTION_FILTER,
                            instrument.id,
                            RunwayDriverDimensionEnum.CATEGORY,
                            RUNWAY_WINDOW_MONTHS,
                            context.language,
                            isCryptoIncluded
                        ),
                        accountBalanceRepository.getLiquidTotal(instrument.id, isCryptoIncluded)
                    ],
                    { concurrency: 'unbounded' }
                );
                const referenceDate = new Date();
                const series = fillRunwaySeriesMonths(seriesRows, referenceDate);
                const computation = computeRunway({
                    series,
                    liquid: liquidRows.at(0)?.total ?? 0,
                    irregularMonthlyAmounts: aggregateRunwayDrivers(driverRows, series, false).irregularMonthlyAmounts,
                    referenceDate
                });

                if (computation.monthsUsed < RUNWAY_MINIMUM_MONTHS) {
                    return null;
                }

                const runway: WidgetRunwaySnapshotInterface = {
                    isPositive: computation.isPositive,
                    label: buildRunwayLabel(computation, instrument.symbol, context)
                };

                return runway;
            });

            const buildNetWorth = Effect.fn('WidgetSnapshotBuilderService.buildNetWorth')(function* (
                instrument: InstrumentEntityInterface,
                isRunwayCryptoIncluded: boolean,
                context: WidgetSnapshotContextInterface
            ) {
                const [netWorthRows, homeRows, monthRows] = yield* Effect.all(
                    [
                        accountBalanceRepository.getNetWorth(instrument.id),
                        accountBalanceRepository.getHomeAccountRows(instrument.id),
                        statisticsRepository.getTotalIncomeAndExpenseQuery(
                            { ...DEFAULT_TRANSACTION_FILTER, date: { from: startOfMonth(new Date()), to: null } },
                            instrument.id
                        )
                    ],
                    { concurrency: 'unbounded' }
                );

                if (!isNotEmptyArray(homeRows)) {
                    return null;
                }

                const total = convertFromMicroUnits(netWorthRows.at(0)?.netWorth ?? 0);
                const monthlyNet = convertFromMicroUnits((monthRows.at(0)?.income ?? 0) - (monthRows.at(0)?.expense ?? 0));
                const runway = yield* buildRunway(instrument, isRunwayCryptoIncluded, context);
                const netWorth: WidgetNetWorthSnapshotInterface = {
                    formattedTotal: formatWithSymbol(total, instrument.symbol, context),
                    formattedDelta: formatDelta(monthlyNet, instrument.symbol, context),
                    deltaColor: resolveDeltaColor(monthlyNet),
                    accountTypes: buildAccountTypeTotals(homeRows, instrument.symbol, context),
                    runway: runway ?? emptyRunway
                };

                return netWorth;
            });

            const buildBudget = Effect.fn('WidgetSnapshotBuilderService.buildBudget')(function* (context: WidgetSnapshotContextInterface) {
                const budget = yield* budgetRepository.findActive();

                if (!isDefined(budget) || !isPositiveNumber(budget.instrumentId) || !isPositiveNumber(budget.overallLimit)) {
                    return null;
                }

                const now = new Date();
                const { periodStart, nextPeriodStart } = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, now);
                const [instrument, projection] = yield* Effect.all(
                    [instrumentRepository.findById(budget.instrumentId), budgetProjectionService.project(budget, now)],
                    { concurrency: 'unbounded' }
                );
                const symbol = instrument?.symbol ?? DEFAULT_INSTRUMENT.symbol;
                const spentAmount = convertFromMicroUnits(projection.overall.spent);
                const limitAmount = convertFromMicroUnits(projection.overall.limit);
                const progressRatio = isPositiveNumber(limitAmount) ? spentAmount / limitAmount : 1;
                const periodEnd = getInclusiveEnd(nextPeriodStart);
                const categories = context.isMasked ? [] : yield* buildBudgetCategories(projection.categories, context);
                const formattedLimit = formatCompactWithSymbol(limitAmount, symbol, context);
                const isOverLimit = spentAmount > limitAmount;
                const formattedSpentAmount = formatCompactWithSymbol(spentAmount, symbol, context);
                const formattedSpentLabel = context.i18n._(msg`${formattedSpentAmount} spent`);
                const formattedReservedAmount = formatCompactWithSymbol(
                    convertFromMicroUnits(projection.overall.upcoming),
                    symbol,
                    context
                );
                const projectedAmount = isDefined(projection.overall.projectedEnd)
                    ? convertFromMicroUnits(projection.overall.projectedEnd)
                    : null;

                const periodDays = Math.max(differenceInCalendarDays(periodEnd, periodStart) + 1, 1);
                const daysCount = Math.max(differenceInCalendarDays(periodEnd, new Date()) + 1, 1);
                const formattedAmount = formatCompactWithSymbol(Math.abs(limitAmount - spentAmount), symbol, context);
                const caption = buildBudgetCaption(isOverLimit, formattedLimit, context);
                const formattedPeriod = formatPeriod(periodStart, periodEnd, context);
                const categorySummary = categories.map(category => `${category.title} ${category.formattedProgress}`).join(', ');
                const sharedFields = {
                    formattedAmount,
                    caption,
                    statusLabel: context.isMasked
                        ? context.i18n._(msg`Budget`)
                        : context.i18n._(BUDGET_PACE_STATUS_LABEL[projection.overall.status]),
                    tone: BUDGET_PACE_VARIANT[projection.overall.status],
                    isOverLimit: isOverLimit && !context.isMasked,
                    isMasked: context.isMasked,
                    spentRatio: context.isMasked ? 0 : Math.min(Math.max(progressRatio, 0), 1),
                    reservedRatio:
                        context.isMasked || !isPositiveNumber(limitAmount)
                            ? 0
                            : Math.min(convertFromMicroUnits(projection.overall.upcoming) / limitAmount, Math.max(1 - progressRatio, 0)),
                    limitRatio: isOverLimit && !context.isMasked ? limitAmount / spentAmount : null,
                    categories,
                    formattedPeriod,
                    formattedReserved:
                        context.isMasked || !isPositiveNumber(projection.overall.upcoming)
                            ? ''
                            : context.i18n._(msg`${formattedReservedAmount} reserved for bills`),
                    formattedHiddenCategories: formatHiddenCategories(
                        projection.categories.filter(category => isPositiveNumber(category.limit)).length - categories.length,
                        context
                    ),
                    formattedSpent: formattedSpentLabel
                };

                return Array.from({ length: daysCount }, (_entry, index) => {
                    const daysRemaining = daysCount - index;
                    const safePerDay = convertFromMicroUnits(computeSafePerDay(projection.overall.free, daysRemaining));
                    const formattedSafePerDay = formatCompactWithSymbol(
                        safePerDay >= compactAmountThreshold ? Math.floor(safePerDay) : Math.floor(safePerDay * 100) / 100,
                        symbol,
                        context
                    );

                    const elapsedRatio = Math.min(projection.overall.elapsedFraction + index / periodDays, 1);
                    const isCaughtUp =
                        projection.overall.status === BudgetPaceStatusEnum.AHEAD && index > 0 && progressRatio <= elapsedRatio;
                    const entryStatus = isCaughtUp ? BudgetPaceStatusEnum.ON_TRACK : projection.overall.status;
                    const entryStatusLabel = context.i18n._(BUDGET_PACE_STATUS_LABEL[entryStatus]);
                    const formattedPerDay = context.i18n._(msg`${formattedSafePerDay} a day`);
                    const formattedDaysLeft = context.i18n._(
                        msg({ message: plural(daysRemaining, { one: '# day left', other: '# days left' }) })
                    );

                    const reservedPrefix = isNotEmptyString(sharedFields.formattedReserved) ? `${sharedFields.formattedReserved}, ` : '';
                    const entryStats = buildBudgetStats(
                        {
                            spentAmount,
                            limitAmount,
                            projectedAmount: isDefined(projectedAmount)
                                ? spentAmount +
                                  (projectedAmount - spentAmount) *
                                      ((1 - elapsedRatio) / Math.max(1 - projection.overall.elapsedFraction, Number.EPSILON))
                                : null,
                            elapsedDays: elapsedRatio * periodDays,
                            symbol
                        },
                        context
                    );
                    const statsSummary = isEmptyArray(categories)
                        ? entryStats.map(stat => `${stat.label} ${stat.value}${isDefined(stat.note) ? `, ${stat.note}` : ''}`).join('. ')
                        : '';
                    const unmaskedSummary = isOverLimit
                        ? context.i18n._(
                              msg`${entryStatusLabel}. ${formattedAmount} ${caption}. ${formattedSpentLabel}, ${formattedDaysLeft}.`
                          )
                        : context.i18n._(
                              msg`${entryStatusLabel}. ${formattedAmount} ${caption}. ${reservedPrefix}${formattedPerDay}, ${formattedDaysLeft}.`
                          );

                    return {
                        date: startOfDay(addDays(periodEnd, -(daysRemaining - 1))),
                        budget: {
                            ...sharedFields,
                            ...(!context.isMasked && {
                                statusLabel: entryStatusLabel,
                                tone: BUDGET_PACE_VARIANT[entryStatus]
                            }),
                            elapsedRatio,
                            stats: entryStats,
                            formattedPerDay,
                            accessibilitySummary: context.isMasked
                                ? context.i18n._(msg`Budget locked, ${formattedDaysLeft}. Unlock to view.`)
                                : unmaskedSummary,
                            formattedDaysLeft,
                            accessibilityDetail: context.isMasked
                                ? formattedPeriod
                                : `${formattedPeriod}. ${categorySummary}${statsSummary}`
                        }
                    };
                });
            });

            const buildSnapshot = Effect.fn('WidgetSnapshotBuilderService.buildSnapshot')(function* (isMaskForced: boolean) {
                const settings = yield* settingsRepository.findSettings();
                const instrument = settings?.defaultInstrument ?? DEFAULT_INSTRUMENT;
                const language = settings?.language ?? LanguageEnum.EN;
                const messages = yield* Effect.orDie(i18nLoadLanguageMessages(language));
                const context: WidgetSnapshotContextInterface = {
                    i18n: setupI18n({ locale: language, messages: { [language]: messages } }),
                    language,
                    locale: languageToLocale(language),
                    decimalPlaces: (settings?.showCents ?? true) ? DEFAULT_DECIMAL_PLACES : 0,
                    isMasked: isMaskForced || (settings?.isPinEnabled ?? false)
                };
                const netWorth = yield* buildNetWorth(instrument, settings?.isRunwayCryptoIncluded ?? false, context);
                const budget = yield* buildBudget(context);
                const snapshot: WidgetSnapshotInterface = { strings: buildStrings(context.i18n), netWorth, budget };

                return snapshot;
            });

            return { buildSnapshot };
        })
    }
) {
    static readonly layer = Layer.effect(WidgetSnapshotBuilderService, WidgetSnapshotBuilderService.make).pipe(
        Layer.provide([
            SettingsRepository.layer,
            AccountBalanceRepository.layer,
            StatisticsRepository.layer,
            InstrumentRepository.layer,
            CategoryRepository.layer,
            BudgetRepository.layer,
            BudgetProjectionService.layer
        ])
    );
}
