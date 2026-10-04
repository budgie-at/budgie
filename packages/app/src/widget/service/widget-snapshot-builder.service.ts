import { BudgetCategoryLimitRepository, budgetPeriodService, BudgetRepository, BudgetSpentService } from '@budgie/budget';
import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CategoryRepository,
    DEFAULT_TRANSACTION_FILTER,
    InstrumentRepository,
    LanguageEnum,
    RUNWAY_WINDOW_MONTHS,
    SettingsRepository,
    StatisticsRepository
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

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { ACCOUNT_TYPE } from '../../account/constant/account-type.constant';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { i18nLoadLanguageMessages } from '../../i18n/util/i18n.util';
import { languageToLocale } from '../../i18n/util/language-to-locale.util';
import { RUNWAY_MINIMUM_MONTHS } from '../../runway/constant/runway-minimum-months.constant';
import { computeRunway } from '../../runway/utils/compute-runway.util';
import { DEFAULT_INSTRUMENT } from '../../settings/constants/default-instrument.constant';

import type { WidgetAccountTypeTotalInterface } from '../interface/widget-account-type-total.interface';
import type { WidgetBudgetCategoryInterface } from '../interface/widget-budget-category.interface';
import type { WidgetNetWorthSnapshotInterface } from '../interface/widget-net-worth-snapshot.interface';
import type { WidgetRunwaySnapshotInterface } from '../interface/widget-runway-snapshot.interface';
import type { WidgetSnapshotContextInterface } from '../interface/widget-snapshot-context.interface';
import type { WidgetSnapshotStringsInterface } from '../interface/widget-snapshot-strings.interface';
import type { WidgetSnapshotInterface } from '../interface/widget-snapshot.interface';
import type { BudgetCategorySpentInterface } from '@budgie/budget';
import type { BudgetCategoryLimitEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';
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
            const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
            const budgetSpentService = yield* BudgetSpentService;
            const emptyRunway: WidgetRunwaySnapshotInterface = { isPositive: true, label: '' };
            const topCategoryCount = 3;
            const topAccountTypeCount = 4;
            const maskedAmount = '•••';

            const formatPercent = (ratio: number, context: WidgetSnapshotContextInterface): string =>
                new Intl.NumberFormat(context.locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);

            const formatWithSymbol = (value: number, symbol: string, context: WidgetSnapshotContextInterface): string => {
                if (context.isMasked) {
                    return maskedAmount;
                }

                return `${symbol}${new Intl.NumberFormat(context.locale, {
                    style: 'decimal',
                    minimumFractionDigits: context.decimalPlaces,
                    maximumFractionDigits: context.decimalPlaces
                }).format(value)}`;
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

            const buildStrings = (i18n: I18n): WidgetSnapshotStringsInterface => ({
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
                    isOverLimit: progressRatio >= 1
                };

                return budgetCategory;
            });

            const buildBudgetCategories = Effect.fn('WidgetSnapshotBuilderService.buildBudgetCategories')(function* (
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
                    .slice(0, topCategoryCount);

                return yield* Effect.all(
                    ranked.map(entry => buildBudgetCategory(entry.categoryId, entry.progressRatio, context)),
                    { concurrency: 'unbounded' }
                );
            });

            const buildRunway = Effect.fn('WidgetSnapshotBuilderService.buildRunway')(function* (
                instrument: InstrumentEntityInterface,
                isCryptoIncluded: boolean,
                context: WidgetSnapshotContextInterface
            ) {
                const [series, liquidRows] = yield* Effect.all(
                    [
                        statisticsRepository.getRunwaySeriesQuery(DEFAULT_TRANSACTION_FILTER, instrument.id, RUNWAY_WINDOW_MONTHS),
                        accountBalanceRepository.getLiquidTotal(instrument.id, isCryptoIncluded)
                    ],
                    { concurrency: 'unbounded' }
                );
                const computation = computeRunway({
                    series,
                    liquid: liquidRows.at(0)?.total ?? 0,
                    irregularMonthlyAmount: 0,
                    isAllIn: false,
                    referenceDate: new Date()
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

                const { periodStart, nextPeriodStart } = budgetPeriodService.computePeriodWindow(
                    budget.periodStartDay,
                    budget.useLastDayOfMonth,
                    new Date()
                );
                const [entries, limits, instrument] = yield* Effect.all(
                    [
                        budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId),
                        budgetCategoryLimitRepository.getByBudget(budget.id),
                        instrumentRepository.findById(budget.instrumentId)
                    ],
                    { concurrency: 'unbounded' }
                );
                const spent = budgetSpentService.computeSpent(entries, budget.instrumentId);
                const symbol = instrument?.symbol ?? DEFAULT_INSTRUMENT.symbol;
                const spentAmount = convertFromMicroUnits(spent.spentOverall);
                const limitAmount = convertFromMicroUnits(budget.overallLimit);
                const periodEnd = budgetPeriodService.getInclusiveEnd(nextPeriodStart);
                const categories = yield* buildBudgetCategories(limits, spent.spentByCategory, context);

                return Array.from({ length: Math.max(differenceInCalendarDays(periodEnd, new Date()) + 1, 1) }, (_entry, index) => {
                    const daysRemaining = index + 1;

                    return {
                        date: startOfDay(addDays(periodEnd, -index)),
                        budget: {
                            formattedSpent: formatWithSymbol(spentAmount, symbol, context),
                            formattedLimit: formatWithSymbol(limitAmount, symbol, context),
                            formattedRemaining: formatWithSymbol(Math.abs(limitAmount - spentAmount), symbol, context),
                            progressRatio: spentAmount / limitAmount,
                            formattedProgress: formatPercent(spentAmount / limitAmount, context),
                            isOverLimit: spentAmount > limitAmount,
                            formattedDaysLeft: context.i18n._(
                                msg({ message: plural(daysRemaining, { one: '# day left', other: '# days left' }) })
                            ),
                            formattedSafePerDay: formatWithSymbol(Math.max(limitAmount - spentAmount, 0) / daysRemaining, symbol, context),
                            categories
                        }
                    };
                }).reverse();
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
            BudgetCategoryLimitRepository.layer,
            BudgetSpentService.layer
        ])
    );
}
