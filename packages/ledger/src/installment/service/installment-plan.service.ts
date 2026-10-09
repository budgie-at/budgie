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
    UserIconNameEnum,
    getInstallmentDueDate
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import { t } from '@lingui/core/macro';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TransactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';

import type { InstallmentPlanConvertInputInterface } from '../interface/installment-plan-convert-input.interface';
import type { TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export class InstallmentPlanService extends Context.Service<InstallmentPlanService>()('@budgie/ledger/InstallmentPlanService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const installmentPlanRepository = yield* InstallmentPlanRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        const dueDateToleranceDays = 3;
        const amountTolerance = 10_000;
        const normalizeTitle = (title: string) => title.trim().replaceAll(/\s+/gu, ' ').toLowerCase();
        const monobankLegacyPaymentPrefix = 'Платіж ';
        const monobankMonthlyPartPrefix = 'Щомісячний платіж ';
        const monobankEarlyPayoffPrefix = 'Дострокове погашення ';
        const getMonobankPaymentMerchant = (title: string) => {
            const matchingPrefix = [monobankLegacyPaymentPrefix, monobankMonthlyPartPrefix].find(prefix => title.startsWith(prefix));

            return normalizeTitle(isDefined(matchingPrefix) ? title.slice(matchingPrefix.length) : title);
        };
        const matchesPartTitle = (externalSource: ExternalSourceEnum | null, title: string, referenceTitle: string): boolean =>
            externalSource === ExternalSourceEnum.MONOBANK
                ? title.startsWith(monobankMonthlyPartPrefix) ||
                  (title.startsWith(monobankLegacyPaymentPrefix) &&
                      getMonobankPaymentMerchant(title) === getMonobankPaymentMerchant(referenceTitle))
                : normalizeTitle(title) === normalizeTitle(referenceTitle);

        const findDueCandidates = (accountId: number, dueAt: Date) =>
            installmentPlanRepository.findCandidates(
                accountId,
                startOfDay(subDays(dueAt, dueDateToleranceDays)),
                endOfDay(addDays(dueAt, dueDateToleranceDays))
            );

        const findNextPartMatches = Effect.fnUntraced(function* (debtAccountId: number) {
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const [firstPart] = yield* installmentPlanRepository.findParts(debtAccountId);

            if (!isDefined(schedule) || !isDefined(schedule.nextDueAt) || !isDefined(schedule.nextAmount) || !isDefined(firstPart)) {
                return [];
            }

            const { nextAmount, remainingAmount } = schedule;
            const candidates = yield* findDueCandidates(firstPart.accountId, schedule.nextDueAt);

            return candidates.filter(
                candidate =>
                    candidate.externalSource === firstPart.externalSource &&
                    (Math.abs(candidate.amount - nextAmount) <= amountTolerance || candidate.amount === remainingAmount) &&
                    matchesPartTitle(firstPart.externalSource, candidate.title, firstPart.title)
            );
        });

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

        const findEarlierPart = Effect.fnUntraced(function* (
            transaction: Pick<TransactionEntityInterface, 'externalSource' | 'title'>,
            primaryEntry: Pick<TransactionEntryEntityInterface, 'accountId' | 'amount'>,
            dueAt: Date
        ) {
            const candidates = yield* findDueCandidates(primaryEntry.accountId, dueAt);
            const [match, ...ambiguousMatches] = candidates.filter(
                candidate =>
                    candidate.externalSource === transaction.externalSource &&
                    Math.abs(candidate.amount - primaryEntry.amount) <= amountTolerance &&
                    matchesPartTitle(transaction.externalSource, candidate.title, transaction.title)
            );

            return isDefined(match) && !isNotEmptyArray(ambiguousMatches) ? match : null;
        });

        const findEarlierParts = Effect.fnUntraced(function* (
            transaction: Pick<TransactionEntityInterface, 'operatedAt' | 'externalSource' | 'title'>,
            primaryEntry: Pick<TransactionEntryEntityInterface, 'accountId' | 'amount'>,
            installmentCount: number
        ) {
            const earlierParts: Array<Pick<TransactionEntityInterface, 'id' | 'operatedAt'>> = [];

            while (earlierParts.length < installmentCount - 1) {
                const earlierPart = yield* findEarlierPart(
                    transaction,
                    primaryEntry,
                    getInstallmentDueDate(transaction.operatedAt, -(earlierParts.length + 1))
                );

                if (!isDefined(earlierPart)) {
                    break;
                }

                earlierParts.unshift({ id: earlierPart.transactionId, operatedAt: earlierPart.operatedAt });
            }

            return earlierParts;
        });

        const findEarlyPayoffMatches = Effect.fnUntraced(function* (debtAccountId: number) {
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const parts = yield* installmentPlanRepository.findParts(debtAccountId);
            const latestPart = parts.at(-1);
            const [firstPart] = parts;

            if (
                !isDefined(schedule) ||
                !isDefined(schedule.nextDueAt) ||
                !isPositiveNumber(schedule.remainingAmount) ||
                !isDefined(latestPart) ||
                !isDefined(firstPart)
            ) {
                return [];
            }

            const candidates = yield* installmentPlanRepository.findCandidates(
                latestPart.accountId,
                latestPart.operatedAt,
                endOfDay(addDays(schedule.nextDueAt, dueDateToleranceDays))
            );

            return candidates.filter(
                candidate =>
                    candidate.externalSource === ExternalSourceEnum.MONOBANK &&
                    firstPart.externalSource === ExternalSourceEnum.MONOBANK &&
                    Math.abs(candidate.amount - schedule.remainingAmount) <= amountTolerance &&
                    candidate.title.startsWith(monobankEarlyPayoffPrefix) &&
                    normalizeTitle(candidate.title.slice(monobankEarlyPayoffPrefix.length)) === getMonobankPaymentMerchant(firstPart.title)
            );
        });

        const attachUniquePart = Effect.fnUntraced(function* (debtAccountId: number, findMatches: typeof findNextPartMatches) {
            const [match, ...ambiguousMatches] = yield* findMatches(debtAccountId);

            if (!isDefined(match) || isNotEmptyArray(ambiguousMatches)) {
                return false;
            }

            const plans = yield* accountRepository.findBySearchQuery('', {
                debtType: AccountDebtTypeEnum.INSTALLMENT,
                onlyActive: true
            });

            for (const plan of plans) {
                if (plan.id !== debtAccountId) {
                    const candidates = yield* findMatches(plan.id);

                    if (candidates.some(candidate => candidate.transactionId === match.transactionId)) {
                        return false;
                    }
                }
            }

            yield* transactionDebtSettlementService.attach({ debtAccountId, transactionId: match.transactionId });

            return true;
        });

        const attachPlanDueParts = Effect.fnUntraced(function* (debtAccountId: number) {
            yield* attachUniquePart(debtAccountId, findNextPartMatches).pipe(Effect.repeat({ while: isAttached => isAttached }));

            const [, ...ambiguousMonthlyMatches] = yield* findNextPartMatches(debtAccountId);

            if (!isNotEmptyArray(ambiguousMonthlyMatches)) {
                yield* attachUniquePart(debtAccountId, findEarlyPayoffMatches);
            }
        });

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

                    const earlierParts = yield* findEarlierParts(transaction, primaryEntry, input.installmentCount);
                    const planStartedAt = earlierParts.at(0)?.operatedAt ?? transaction.operatedAt;
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
                        operatedAt: planStartedAt
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
                        operatedAt: planStartedAt
                    });
                    yield* Effect.forEach(
                        [...earlierParts.map(earlierPart => earlierPart.id), transaction.id],
                        transactionId => transactionDebtSettlementService.attach({ debtAccountId: account.id, transactionId }),
                        { discard: true }
                    );
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
