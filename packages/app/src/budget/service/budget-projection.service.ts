import {
    BudgetCategoryLimitRepository,
    BudgetCommittedSourceKindEnum,
    BudgetPeriodSnapshotRepository,
    BudgetRepository,
    buildPeriodMonths,
    computeBudgetProjection,
    computeEffectiveLimits,
    computePeriodWindow,
    convertEntryAmount
} from '@budgie/budget';
import { AccountDebtTypeEnum, AccountRepository, InstallmentPlanRepository, SettingsRepository } from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import { RecurringService } from '@budgie/recurring';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { BudgetCommittedSourceInterface, BudgetUpcomingChargeInterface } from '@budgie/budget';
import type { BudgetEntityInterface } from '@budgie/contracts';
import type { RecurringCalendarDataInterface } from '@budgie/recurring';

export class BudgetProjectionService extends Context.Service<BudgetProjectionService>()('@budgie/app/BudgetProjectionService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const budgetCategoryLimitRepository = yield* BudgetCategoryLimitRepository;
        const budgetPeriodSnapshotRepository = yield* BudgetPeriodSnapshotRepository;
        const budgetRepository = yield* BudgetRepository;
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

        const loadRecurring = Effect.fnUntraced(function* (
            periodStart: Date,
            nextPeriodStart: Date,
            now: Date,
            budgetInstrumentId: number
        ) {
            const { defaultInstrumentId } = yield* settingsRepository.getSettings();
            const rate = yield* findRate(defaultInstrumentId, budgetInstrumentId);
            const calendars = yield* Effect.forEach(buildPeriodMonths({ periodStart, nextPeriodStart }), month =>
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

        return {
            project: Effect.fn('BudgetProjectionService.project')(function* (
                budget: Pick<
                    BudgetEntityInterface,
                    | 'id'
                    | 'period'
                    | 'periodStartDay'
                    | 'useLastDayOfMonth'
                    | 'periodAnchorDate'
                    | 'instrumentId'
                    | 'overallLimit'
                    | 'otherLimit'
                >,
                now: Date
            ) {
                const { periodStart, nextPeriodStart } = computePeriodWindow(budget, now);
                const categoryLimits = yield* budgetCategoryLimitRepository.getByBudget(budget.id);
                const [latestSnapshot] = yield* budgetPeriodSnapshotRepository.findRecent(budget.id, 1);
                const effectiveLimits = computeEffectiveLimits(latestSnapshot, budget, categoryLimits);
                const spentEntries = yield* budgetRepository.findBudgetSpentEntries(periodStart, nextPeriodStart, budget.instrumentId);
                const installmentPayments = yield* budgetRepository.findInstallmentPayments(periodStart, nextPeriodStart);
                const installmentAccountIdByTransactionId = new Map(
                    installmentPayments.map(payment => [payment.transactionId, payment.installmentAccountId] as const)
                );
                const recurring = yield* loadRecurring(periodStart, nextPeriodStart, now, budget.instrumentId);
                const installmentCharges = yield* loadInstallmentCharges(budget.instrumentId);

                return computeBudgetProjection({
                    periodStart,
                    nextPeriodStart,
                    now,
                    overallLimit: effectiveLimits.overallLimit,
                    otherLimit: effectiveLimits.otherLimit,
                    categoryLimits: effectiveLimits.categoryLimits,
                    entries: spentEntries.map(entry => ({
                        amount: convertEntryAmount(entry, budget.instrumentId),
                        categoryId: entry.categoryId,
                        operatedAt: entry.operatedAt,
                        committedSource: resolveCommittedSource(
                            installmentAccountIdByTransactionId.get(entry.transactionId),
                            recurring.seriesIdByTransactionId.get(entry.transactionId)
                        )
                    })),
                    upcomingCharges: [...recurring.charges, ...installmentCharges],
                    reservations: []
                });
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetProjectionService, BudgetProjectionService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            BudgetCategoryLimitRepository.layer,
            BudgetPeriodSnapshotRepository.layer,
            BudgetRepository.layer,
            ExchangeRateRepository.layer,
            InstallmentPlanRepository.layer,
            RecurringService.layer,
            SettingsRepository.layer
        ])
    );
}
