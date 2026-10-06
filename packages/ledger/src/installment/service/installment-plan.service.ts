import {
    AccountDebtTypeEnum,
    AccountNatureEnum,
    AccountRepository,
    AccountTypeEnum,
    Db,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    ExternalSourceEnum,
    InstallmentPlanRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionRepository,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import { t } from '@lingui/core/macro';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TransactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';

import type { InstallmentPlanConvertInputInterface } from '../interface/installment-plan-convert-input.interface';

export class InstallmentPlanService extends Context.Service<InstallmentPlanService>()('@budgie/ledger/InstallmentPlanService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const installmentPlanRepository = yield* InstallmentPlanRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        const dueDateToleranceMs = 3 * 24 * 60 * 60 * 1000;
        const amountTolerance = 10_000;
        const partTitleMatchers: ReadonlyMap<ExternalSourceEnum, (title: string) => boolean> = new Map([
            [ExternalSourceEnum.MONOBANK, (title: string) => title.startsWith('Щомісячний платіж ')]
        ]);

        const matchesBankSignal = (externalSource: ExternalSourceEnum | null, title: string): boolean =>
            !isDefined(externalSource) || (partTitleMatchers.get(externalSource)?.(title) ?? true);

        const getExpensePrimaryEntryOrFail = Effect.fnUntraced(function* (transactionId: number) {
            const transaction = yield* transactionRepository.getByIdWithEntries(transactionId);

            if (!isDefined(transaction) || transaction.type !== TransactionTypeEnum.EXPENSE) {
                return yield* Effect.die(new Error(t`Only an expense can become an installment plan`));
            }

            const [primaryEntry, ...extraPrimaryEntries] = transaction.entries.filter(
                entry => entry.kind === TransactionEntryKindEnum.PRIMARY
            );

            if (!isDefined(primaryEntry) || isNotEmptyArray(extraPrimaryEntries)) {
                return yield* Effect.die(new Error(t`Transaction must have exactly one primary entry`));
            }

            return { transaction, primaryEntry };
        });

        const attachNextPart = Effect.fnUntraced(function* (debtAccountId: number) {
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const [firstPart] = yield* installmentPlanRepository.findParts(debtAccountId);

            if (!isDefined(schedule) || !isDefined(schedule.nextDueAt) || !isDefined(schedule.nextAmount) || !isDefined(firstPart)) {
                return false;
            }

            const { nextAmount, remainingAmount } = schedule;
            const dueAt = schedule.nextDueAt.getTime();
            const candidates = yield* installmentPlanRepository.findCandidates(
                firstPart.accountId,
                new Date(dueAt - dueDateToleranceMs),
                new Date(dueAt + dueDateToleranceMs)
            );
            const [match, ...ambiguousMatches] = candidates.filter(
                candidate =>
                    (Math.abs(candidate.amount - nextAmount) <= amountTolerance || candidate.amount === remainingAmount) &&
                    matchesBankSignal(firstPart.externalSource, candidate.title)
            );

            if (!isDefined(match) || isNotEmptyArray(ambiguousMatches)) {
                return false;
            }

            yield* transactionDebtSettlementService.attach({ debtAccountId, transactionId: match.transactionId });

            return true;
        });

        const attachPlanDueParts = (debtAccountId: number) =>
            attachNextPart(debtAccountId).pipe(Effect.repeat({ while: isAttached => isAttached }));

        const cancelRefundedPlan = Effect.fnUntraced(function* (debtAccountId: number) {
            const parts = yield* installmentPlanRepository.findParts(debtAccountId);
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const manualEvents = yield* debtEventRepository.findByAccountIdAndSource(debtAccountId, DebtEventSourceEnum.MANUAL);
            const openEvent = manualEvents.find(debtEvent => debtEvent.direction === DebtEventDirectionEnum.OPEN);
            const isRefunded = parts.some(part => part.consolidationType === TransactionConsolidationTypeEnum.REFUND);

            if (!isRefunded || !isDefined(schedule) || !isPositiveNumber(schedule.remainingAmount) || !isDefined(openEvent)) {
                return;
            }

            const amount = schedule.paidAmount;
            const baseAmount = isDefined(openEvent.baseExchangeRate) ? Math.round(amount * openEvent.baseExchangeRate) : null;

            yield* debtEventRepository.updateById(openEvent.id, { amount, baseAmount });
            yield* accountRepository.updateById(debtAccountId, { targetBalance: amount, targetBaseAmount: baseAmount });
            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([debtAccountId]);
        });

        return {
            convertExpense: Effect.fn('InstallmentPlanService.convertExpense')(
                function* (input: InstallmentPlanConvertInputInterface) {
                    const { transaction, primaryEntry } = yield* getExpensePrimaryEntryOrFail(input.transactionId);
                    const [sourceAccount] = yield* accountRepository.findByIds([primaryEntry.accountId]);

                    if (!isDefined(sourceAccount)) {
                        return yield* Effect.die(new Error(t`Account ${primaryEntry.accountId} not found`));
                    }

                    const [{ count }] = yield* accountRepository.count();
                    const account = yield* accountRepository.create({
                        title: input.title,
                        icon: UserIconNameEnum.CalendarClock,
                        order: count + 1,
                        type: AccountTypeEnum.DEBT,
                        nature: AccountNatureEnum.LIABILITY,
                        debtType: AccountDebtTypeEnum.INSTALLMENT,
                        instrumentId: sourceAccount.instrumentId,
                        targetBalance: input.totalAmount,
                        installmentCount: input.installmentCount
                    });
                    const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                        accountId: account.id,
                        amount: input.totalAmount,
                        operatedAt: transaction.operatedAt
                    });

                    yield* accountRepository.updateById(account.id, {
                        targetBaseInstrumentId: valuation.baseInstrumentId,
                        targetBaseExchangeRate: valuation.baseExchangeRate,
                        targetBaseAmount: valuation.baseAmount
                    });
                    yield* debtEventRepository.create({
                        debtAccountId: account.id,
                        transactionId: null,
                        transactionEntryId: null,
                        direction: DebtEventDirectionEnum.OPEN,
                        source: DebtEventSourceEnum.MANUAL,
                        amount: input.totalAmount,
                        baseInstrumentId: valuation.baseInstrumentId,
                        baseExchangeRate: valuation.baseExchangeRate,
                        baseAmount: valuation.baseAmount,
                        operatedAt: transaction.operatedAt
                    });
                    yield* transactionDebtSettlementService.attach({ debtAccountId: account.id, transactionId: transaction.id });
                    yield* attachPlanDueParts(account.id);

                    return { accountId: account.id };
                },
                effect => Db.transaction(effect)
            ),
            attachDueParts: Effect.fn('InstallmentPlanService.attachDueParts')(function* () {
                const plans = yield* accountRepository.findBySearchQuery('', {
                    debtType: AccountDebtTypeEnum.INSTALLMENT,
                    onlyActive: true
                });

                yield* Effect.forEach(
                    plans,
                    plan => Db.transaction(Effect.andThen(cancelRefundedPlan(plan.id), attachPlanDueParts(plan.id))),
                    { discard: true }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(InstallmentPlanService, InstallmentPlanService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            InstallmentPlanRepository.layer,
            TransactionRepository.layer,
            AccountBalanceIncrementalService.layer,
            TransactionDebtSettlementService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
