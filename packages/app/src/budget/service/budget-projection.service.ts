import {
    BudgetCategoryLimitRepository,
    BudgetCommittedSourceKindEnum,
    BudgetFundSpendService,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    BudgetSinkingFundRepository,
    applyFundDraws,
    buildPeriodMonths,
    computeBudgetProjection,
    computeEffectiveLimits,
    computeExpectedIncome,
    computeFundReservations,
    computeIncomeReceived,
    computeSpent,
    resolveBudgetOverallLimit,
    toBudgetCurrencyEntries
} from '@budgie/budget';
import {
    AccountDebtTypeEnum,
    AccountRepository,
    BudgetKindEnum,
    BudgetLimitSourceEnum,
    InstallmentPlanRepository,
    SettingsRepository
} from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import { RecurringService } from '@budgie/recurring';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { resolveBudgetWindow } from '../utils/resolve-budget-window.util';

import type { BudgetProjectionSourceInterface } from '../interface/budget-projection-source.interface';
import type { BudgetCommittedSourceInterface, BudgetPeriodWindowInterface, BudgetUpcomingChargeInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';
import type { RecurringCalendarDataInterface } from '@budgie/recurring';

export class BudgetProjectionService extends Context.Service<BudgetProjectionService>()('@budgie/app/BudgetProjectionService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetFundSpendService = yield* BudgetFundSpendService;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const budgetRepository = yield* BudgetRepository;
        const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const installmentPlanRepository = yield* InstallmentPlanRepository;
        const recurringService = yield* RecurringService;
        const settingsRepository = yield* SettingsRepository;

        const installmentCadenceDays = 30;

        const findRate = Effect.fnUntraced(function* (fromInstrumentId: number | null, budgetInstrumentId: number) {
            if (!isDefined(fromInstrumentId) || fromInstrumentId === budgetInstrumentId) {
                return 1;
            }

            const exchangeRate = yield* exchangeRateRepository.findByBaseAndQuoteIds(fromInstrumentId, budgetInstrumentId);

            return isDefined(exchangeRate) ? exchangeRate.rate : 1;
        });

        const toRecurringCharges = (month: Date, calendar: RecurringCalendarDataInterface, rate: number): BudgetUpcomingChargeInterface[] =>
            [...calendar.forecastedEntriesByDay.values()].flat().map(entry => ({
                date: new Date(month.getFullYear(), month.getMonth(), entry.dayOfMonth),
                amount: Math.round(entry.latestAmount * rate),
                categoryId: entry.categoryId,
                title: entry.title,
                source: { kind: BudgetCommittedSourceKindEnum.RECURRING, id: entry.seriesId },
                cadenceDays: entry.periodDays
            }));

        const loadRecurring = Effect.fnUntraced(function* (window: BudgetPeriodWindowInterface, now: Date, budgetInstrumentId: number) {
            const { defaultInstrumentId } = yield* settingsRepository.getSettings();
            const rate = yield* findRate(defaultInstrumentId, budgetInstrumentId);
            const calendars = yield* Effect.forEach(buildPeriodMonths(window), month =>
                Effect.map(recurringService.calendar(month.getFullYear(), month.getMonth(), now), calendar => ({ month, calendar }))
            );
            const postedEntries = calendars.flatMap(({ calendar }) => [...calendar.entriesByDay.values()].flat());

            return {
                seriesIdByTransactionId: new Map(
                    postedEntries.flatMap(entry =>
                        isDefined(entry.latestTransactionId) ? [[entry.latestTransactionId, entry.seriesId] as const] : []
                    )
                ),
                charges: calendars.flatMap(({ month, calendar }) => toRecurringCharges(month, calendar, rate))
            };
        });

        const loadInstallmentCharges = Effect.fnUntraced(function* (budgetInstrumentId: number) {
            const accounts = yield* accountRepository.getAllActiveAccounts();
            const charges = yield* Effect.forEach(
                accounts.filter(account => account.debtType === AccountDebtTypeEnum.INSTALLMENT),
                Effect.fnUntraced(function* (account) {
                    const schedule = yield* installmentPlanRepository.getSchedule(account.id);

                    if (!isDefined(schedule) || !isDefined(schedule.nextDueAt) || !isPositiveNumber(schedule.nextAmount)) {
                        return [];
                    }

                    const rate = yield* findRate(schedule.instrumentId, budgetInstrumentId);
                    const charge: BudgetUpcomingChargeInterface = {
                        date: schedule.nextDueAt,
                        amount: Math.round(schedule.nextAmount * rate),
                        categoryId: null,
                        title: account.title,
                        source: { kind: BudgetCommittedSourceKindEnum.INSTALLMENT, id: account.id },
                        cadenceDays: installmentCadenceDays
                    };

                    return [charge];
                })
            );

            return charges.flat();
        });

        const resolveCommittedSource = (
            installmentAccountId: number | undefined,
            seriesId: number | undefined
        ): BudgetCommittedSourceInterface | null => {
            if (isDefined(installmentAccountId)) {
                return { kind: BudgetCommittedSourceKindEnum.INSTALLMENT, id: installmentAccountId };
            }

            return isDefined(seriesId) ? { kind: BudgetCommittedSourceKindEnum.RECURRING, id: seriesId } : null;
        };

        const loadSpentEntries = Effect.fnUntraced(function* (
            budget: BudgetProjectionSourceInterface,
            window: BudgetPeriodWindowInterface
        ) {
            if (budget.kind === BudgetKindEnum.EVENT) {
                if (!isDefined(budget.tagId)) {
                    return { entries: [], grossEntries: [] };
                }

                const eventEntries = yield* budgetRepository.findEventSpentEntries(
                    window.periodStart,
                    window.nextPeriodStart,
                    budget.instrumentId,
                    budget.tagId
                );

                return { entries: toBudgetCurrencyEntries(eventEntries, budget.instrumentId), grossEntries: [] };
            }

            const { entries: grossEntries, draws } = yield* budgetFundSpendService.findSpentWithDraws(
                budget,
                window.periodStart,
                window.nextPeriodStart
            );

            return { entries: applyFundDraws(grossEntries, draws), grossEntries };
        });

        const loadExpectedIncome = Effect.fnUntraced(function* (
            window: BudgetPeriodWindowInterface,
            now: Date,
            budgetInstrumentId: number
        ) {
            const { defaultInstrumentId } = yield* settingsRepository.getSettings();
            const rate = yield* findRate(defaultInstrumentId, budgetInstrumentId);
            const months = yield* Effect.forEach(buildPeriodMonths(window), month =>
                Effect.map(recurringService.incomeCalendar(month.getFullYear(), month.getMonth(), now), calendar => ({ month, calendar }))
            );

            return computeExpectedIncome(months, window, rate);
        });

        const loadIncome = Effect.fnUntraced(function* (
            budget: BudgetProjectionSourceInterface,
            window: BudgetPeriodWindowInterface,
            now: Date
        ) {
            if (budget.limitSource === BudgetLimitSourceEnum.FIXED) {
                return { received: 0, expected: 0 };
            }

            const receivedEntries = yield* budgetRepository.findIncomeReceivedEntries(
                window.periodStart,
                window.nextPeriodStart,
                budget.instrumentId
            );
            const received = computeIncomeReceived(receivedEntries, budget.instrumentId);

            if (budget.limitSource !== BudgetLimitSourceEnum.INCOME_EXPECTED) {
                return { received, expected: 0 };
            }

            return { received, expected: yield* loadExpectedIncome(window, now, budget.instrumentId) };
        });

        const project = Effect.fn('BudgetProjectionService.project')(function* (budget: BudgetProjectionSourceInterface, now: Date) {
            const window = resolveBudgetWindow(budget, now);
            const projectionNow = now.getTime() < window.periodStart.getTime() ? window.periodStart : now;
            const isEvent = budget.kind === BudgetKindEnum.EVENT;
            const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
            const recentSnapshots = isEvent ? [] : yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
            const income = yield* loadIncome(budget, window, now);
            const overallLimit = resolveBudgetOverallLimit(budget.limitSource, budget.overallLimit, income.received, income.expected);
            const effectiveLimits = computeEffectiveLimits(
                recentSnapshots[0],
                { overallLimit, otherLimit: budget.otherLimit },
                categoryLimits
            );
            const { entries: spentEntries, grossEntries } = yield* loadSpentEntries(budget, window);
            const installmentPayments = isEvent
                ? []
                : yield* budgetRepository.findInstallmentPayments(window.periodStart, window.nextPeriodStart);
            const installmentAccountIdByTransactionId = new Map(
                installmentPayments.map(payment => [payment.transactionId, payment.installmentAccountId] as const)
            );
            const recurring = isEvent
                ? { seriesIdByTransactionId: new Map<number, number>(), charges: [] }
                : yield* loadRecurring(window, now, budget.instrumentId);
            const installmentCharges = isEvent ? [] : yield* loadInstallmentCharges(budget.instrumentId);
            const funds = isEvent ? [] : yield* budgetSinkingFundRepository.getByBudget(budget.id);
            const { reservations, upcomingCharges } = computeFundReservations(funds, window, budget, {
                periodEntries: grossEntries,
                upcomingCharges: [...recurring.charges, ...installmentCharges]
            });

            return computeBudgetProjection({
                periodStart: window.periodStart,
                nextPeriodStart: window.nextPeriodStart,
                now: projectionNow,
                overallLimit: effectiveLimits.overallLimit,
                otherLimit: effectiveLimits.otherLimit,
                categoryLimits: effectiveLimits.categoryLimits,
                entries: spentEntries.map(entry => ({
                    amount: entry.amount,
                    categoryId: entry.categoryId,
                    operatedAt: entry.operatedAt,
                    committedSource: resolveCommittedSource(
                        installmentAccountIdByTransactionId.get(entry.transactionId),
                        recurring.seriesIdByTransactionId.get(entry.transactionId)
                    )
                })),
                upcomingCharges,
                reservations
            });
        });

        return {
            project,
            projectEvents: Effect.fn('BudgetProjectionService.projectEvents')(function* (now: Date) {
                const events = yield* budgetRepository.findActiveEvents(now);

                return yield* Effect.forEach(events, (event: BudgetEntityInterface) =>
                    Effect.map(project(event, now), projection => ({ budget: event, projection }))
                );
            }),
            spent: Effect.fn('BudgetProjectionService.spent')(function* (budget: BudgetProjectionSourceInterface, now: Date) {
                const { entries } = yield* loadSpentEntries(budget, resolveBudgetWindow(budget, now));

                return computeSpent(entries, budget.instrumentId);
            }),
            expectedIncome: Effect.fn('BudgetProjectionService.expectedIncome')(function* (
                budget: BudgetProjectionSourceInterface,
                now: Date
            ) {
                return yield* loadExpectedIncome(resolveBudgetWindow(budget, now), now, budget.instrumentId);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetProjectionService, BudgetProjectionService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            BudgetCategoryLimitRepository.layer,
            BudgetFundSpendService.layer,
            BudgetPeriodSnapshotRepository.layer,
            BudgetRepository.layer,
            BudgetSinkingFundRepository.layer,
            ExchangeRateRepository.layer,
            InstallmentPlanRepository.layer,
            RecurringService.layer,
            SettingsRepository.layer
        ])
    );
}
