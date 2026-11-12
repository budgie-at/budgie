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
    INSTALLMENT_AMOUNT_TOLERANCE,
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
import { addDays, differenceInCalendarMonths, endOfDay, max, startOfDay, subDays } from 'date-fns';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { AccountArchiveService } from '../../account/service/account-archive.service';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TransactionDebtSettlementService } from '../../transaction/service/transaction-debt-settlement.service';

import type { InstallmentPlanConvertInputInterface } from '../interface/installment-plan-convert-input.interface';
import type { TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

const UNIX_EPOCH = new Date(0);

export class InstallmentPlanService extends Context.Service<InstallmentPlanService>()('@budgie/ledger/InstallmentPlanService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const debtEventRepository = yield* DebtEventRepository;
        const installmentPlanRepository = yield* InstallmentPlanRepository;
        const transactionRepository = yield* TransactionRepository;
        const accountArchiveService = yield* AccountArchiveService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
        const entryBaseValuationService = yield* EntryBaseValuationService;

        const dueDateToleranceDays = 3;
        const normalizeTitle = (title: string) => title.trim().replaceAll(/\s+/gu, ' ').toLowerCase();
        const monobankLegacyPaymentPrefix = 'Платіж ';
        const monobankMonthlyPartPrefix = 'Щомісячний платіж ';
        const monobankEarlyPayoffPrefix = 'Дострокове погашення ';
        const getMonobankPaymentMerchant = (title: string) => {
            const matchingPrefix = [monobankLegacyPaymentPrefix, monobankMonthlyPartPrefix].find(prefix => title.startsWith(prefix));

            return normalizeTitle(isDefined(matchingPrefix) ? title.slice(matchingPrefix.length) : title);
        };

        const isSamePlanExpense = (
            candidate: Pick<TransactionEntityInterface, 'externalSource' | 'title'>,
            reference: Pick<TransactionEntityInterface, 'externalSource' | 'title'>
        ) =>
            isNotEmptyString(normalizeTitle(reference.title)) &&
            candidate.externalSource === reference.externalSource &&
            normalizeTitle(candidate.title) === normalizeTitle(reference.title);
        const isAcceptableFlexibleAmount = (amount: number, regularAmount: number, remainingAmount: number) => {
            const multiple = Math.round(amount / regularAmount);

            return (
                amount <= remainingAmount &&
                (remainingAmount - amount <= INSTALLMENT_AMOUNT_TOLERANCE ||
                    (isPositiveNumber(multiple) && Math.abs(amount - multiple * regularAmount) <= INSTALLMENT_AMOUNT_TOLERANCE))
            );
        };

        const findAttachableCandidates = (accountId: number, from: Date, to: Date) =>
            installmentPlanRepository.findCandidates(accountId, from, to).pipe(
                Effect.map(candidates => {
                    const entryCounts = new Map<number, number>();

                    candidates.forEach(candidate => {
                        entryCounts.set(candidate.transactionId, (entryCounts.get(candidate.transactionId) ?? 0) + 1);
                    });

                    return candidates.filter(candidate => entryCounts.get(candidate.transactionId) === 1);
                })
            );

        const findDueCandidates = (accountId: number, dueAt: Date) =>
            findAttachableCandidates(
                accountId,
                startOfDay(subDays(dueAt, dueDateToleranceDays)),
                endOfDay(addDays(dueAt, dueDateToleranceDays))
            );

        const hasUnconvertedMonthlyOwner = Effect.fnUntraced(function* (
            accountId: number,
            candidate: Effect.Success<ReturnType<typeof installmentPlanRepository.findCandidates>>[number],
            planTransactionIds: readonly number[]
        ) {
            if (candidate.externalSource !== ExternalSourceEnum.MONOBANK || !candidate.title.startsWith(monobankMonthlyPartPrefix)) {
                return false;
            }

            const purchases = yield* installmentPlanRepository.findCandidates(accountId, UNIX_EPOCH, candidate.operatedAt);

            return purchases.some(purchase => {
                const monthOffset = differenceInCalendarMonths(candidate.operatedAt, purchase.operatedAt);

                return (
                    !planTransactionIds.includes(purchase.transactionId) &&
                    purchase.externalSource === ExternalSourceEnum.MONOBANK &&
                    purchase.title.startsWith(monobankLegacyPaymentPrefix) &&
                    Math.abs(purchase.amount - candidate.amount) <= INSTALLMENT_AMOUNT_TOLERANCE &&
                    [monthOffset - 1, monthOffset, monthOffset + 1].some(offset => {
                        const dueAt = getInstallmentDueDate(purchase.operatedAt, offset);

                        return (
                            isPositiveNumber(offset) &&
                            candidate.operatedAt >= startOfDay(subDays(dueAt, dueDateToleranceDays)) &&
                            candidate.operatedAt <= endOfDay(addDays(dueAt, dueDateToleranceDays))
                        );
                    })
                );
            });
        });

        const findNextPartMatches = Effect.fnUntraced(function* (debtAccountId: number) {
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const [firstPart] = yield* installmentPlanRepository.findParts(debtAccountId);

            if (!isDefined(schedule) || !isDefined(schedule.nextDueAt) || !isDefined(schedule.nextAmount) || !isDefined(firstPart)) {
                return [];
            }

            const { nextAmount, remainingAmount } = schedule;

            if (firstPart.externalSource !== ExternalSourceEnum.MONOBANK) {
                const regularAmount = Math.round(schedule.totalAmount / schedule.installmentCount);
                const flexibleCandidates = yield* findAttachableCandidates(
                    firstPart.accountId,
                    firstPart.operatedAt,
                    endOfDay(
                        addDays(
                            max([schedule.nextDueAt, getInstallmentDueDate(firstPart.operatedAt, schedule.installmentCount - 1)]),
                            dueDateToleranceDays
                        )
                    )
                );

                return flexibleCandidates
                    .filter(
                        candidate =>
                            isSamePlanExpense(candidate, firstPart) &&
                            isAcceptableFlexibleAmount(candidate.amount, regularAmount, remainingAmount)
                    )
                    .sort(
                        (left, right) => left.operatedAt.getTime() - right.operatedAt.getTime() || left.transactionId - right.transactionId
                    )
                    .slice(0, 1);
            }

            const candidates = yield* findDueCandidates(firstPart.accountId, schedule.nextDueAt);

            return yield* Effect.filter(
                candidates.filter(
                    candidate =>
                        candidate.externalSource === firstPart.externalSource &&
                        (Math.abs(candidate.amount - nextAmount) <= INSTALLMENT_AMOUNT_TOLERANCE || candidate.amount === remainingAmount) &&
                        candidate.title.startsWith(monobankMonthlyPartPrefix)
                ),
                candidate =>
                    hasUnconvertedMonthlyOwner(firstPart.accountId, candidate, [firstPart.transactionId]).pipe(
                        Effect.map(hasOwner => !hasOwner)
                    )
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

        const findFlexibleEarlierParts = Effect.fnUntraced(function* (
            transaction: Pick<TransactionEntityInterface, 'id' | 'operatedAt' | 'externalSource' | 'title'>,
            primaryEntry: Pick<TransactionEntryEntityInterface, 'accountId' | 'amount'>,
            installmentCount: number,
            totalAmount: number
        ) {
            const regularAmount = Math.round(totalAmount / installmentCount);
            const candidates = yield* findAttachableCandidates(
                primaryEntry.accountId,
                startOfDay(subDays(getInstallmentDueDate(transaction.operatedAt, -(installmentCount - 1)), dueDateToleranceDays)),
                transaction.operatedAt
            );
            const newestFirst = candidates
                .filter(candidate => candidate.transactionId !== transaction.id && isSamePlanExpense(candidate, transaction))
                .sort((left, right) => right.operatedAt.getTime() - left.operatedAt.getTime() || right.transactionId - left.transactionId);
            const earlierParts: Array<(typeof newestFirst)[number]> = [];
            let remainingAmount = totalAmount - primaryEntry.amount;

            for (const candidate of newestFirst) {
                if (remainingAmount <= INSTALLMENT_AMOUNT_TOLERANCE) {
                    break;
                }

                if (isAcceptableFlexibleAmount(candidate.amount, regularAmount, remainingAmount)) {
                    earlierParts.unshift(candidate);
                    remainingAmount -= candidate.amount;
                }
            }

            return earlierParts.map(part => ({ id: part.transactionId, operatedAt: part.operatedAt }));
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
                    Math.abs(candidate.amount - primaryEntry.amount) <= INSTALLMENT_AMOUNT_TOLERANCE &&
                    (candidate.title.startsWith(monobankMonthlyPartPrefix) ||
                        (candidate.title.startsWith(monobankLegacyPaymentPrefix) &&
                            getMonobankPaymentMerchant(candidate.title) === getMonobankPaymentMerchant(transaction.title)))
            );

            return isDefined(match) && !isNotEmptyArray(ambiguousMatches) ? match : null;
        });

        const findEarlierParts = Effect.fnUntraced(function* (
            transaction: Pick<TransactionEntityInterface, 'id' | 'operatedAt' | 'externalSource' | 'title'>,
            primaryEntry: Pick<TransactionEntryEntityInterface, 'accountId' | 'amount'>,
            installmentCount: number,
            totalAmount: number
        ) {
            if (transaction.externalSource !== ExternalSourceEnum.MONOBANK) {
                return yield* findFlexibleEarlierParts(transaction, primaryEntry, installmentCount, totalAmount);
            }

            const earlierParts: Array<Effect.Success<ReturnType<typeof installmentPlanRepository.findCandidates>>[number]> = [];

            while (earlierParts.length < installmentCount - 1) {
                const earlierPart = yield* findEarlierPart(
                    transaction,
                    primaryEntry,
                    getInstallmentDueDate(transaction.operatedAt, -(earlierParts.length + 1))
                );

                if (!isDefined(earlierPart)) {
                    break;
                }

                earlierParts.unshift(earlierPart);
            }

            const planTransactionIds = [transaction.id, ...earlierParts.map(part => part.transactionId)];

            for (const earlierPart of earlierParts) {
                if (yield* hasUnconvertedMonthlyOwner(primaryEntry.accountId, earlierPart, planTransactionIds)) {
                    return [];
                }
            }

            return earlierParts.map(part => ({ id: part.transactionId, operatedAt: part.operatedAt }));
        });

        const findEarlyPayoffMatches = Effect.fnUntraced(function* (debtAccountId: number) {
            const schedule = yield* installmentPlanRepository.getSchedule(debtAccountId);
            const parts = yield* installmentPlanRepository.findParts(debtAccountId);
            const latestPart = parts.at(-1);
            const [firstPart] = parts;

            if (!isDefined(schedule) || !isPositiveNumber(schedule.remainingAmount) || !isDefined(latestPart) || !isDefined(firstPart)) {
                return [];
            }

            const candidates = yield* findAttachableCandidates(
                latestPart.accountId,
                latestPart.operatedAt,
                endOfDay(addDays(getInstallmentDueDate(firstPart.operatedAt, schedule.installmentCount - 1), dueDateToleranceDays))
            );

            return candidates.filter(
                candidate =>
                    candidate.externalSource === ExternalSourceEnum.MONOBANK &&
                    firstPart.externalSource === ExternalSourceEnum.MONOBANK &&
                    Math.abs(candidate.amount - schedule.remainingAmount) <= INSTALLMENT_AMOUNT_TOLERANCE &&
                    candidate.title.startsWith(monobankEarlyPayoffPrefix) &&
                    normalizeTitle(candidate.title.slice(monobankEarlyPayoffPrefix.length)) === getMonobankPaymentMerchant(firstPart.title)
            );
        });

        const attachUniquePart = Effect.fnUntraced(function* (
            debtAccountId: number,
            activePlanIds: readonly number[],
            findMatches: typeof findNextPartMatches
        ) {
            const [match, ...ambiguousMatches] = yield* findMatches(debtAccountId);

            if (!isDefined(match) || isNotEmptyArray(ambiguousMatches)) {
                return false;
            }

            for (const planId of activePlanIds) {
                if (planId !== debtAccountId) {
                    const candidates = yield* findMatches(planId);

                    if (candidates.some(candidate => candidate.transactionId === match.transactionId)) {
                        return false;
                    }
                }
            }

            yield* transactionDebtSettlementService.attach({ debtAccountId, transactionId: match.transactionId });

            return true;
        });

        const findActivePlanIds = Effect.fnUntraced(function* () {
            const plans = yield* accountRepository.findBySearchQuery('', {
                debtType: AccountDebtTypeEnum.INSTALLMENT,
                onlyActive: true
            });

            return plans.map(plan => plan.id);
        });

        const attachPlanDueParts = Effect.fnUntraced(function* (debtAccountId: number, activePlanIds: readonly number[]) {
            const attachNextPartOrPayoff = Effect.fnUntraced(function* () {
                const [, ...ambiguousMonthlyMatches] = yield* findNextPartMatches(debtAccountId);

                if (isNotEmptyArray(ambiguousMonthlyMatches)) {
                    return false;
                }

                if (yield* attachUniquePart(debtAccountId, activePlanIds, findEarlyPayoffMatches)) {
                    return false;
                }

                return yield* attachUniquePart(debtAccountId, activePlanIds, findNextPartMatches);
            });

            yield* attachNextPartOrPayoff().pipe(Effect.repeat({ while: isAttached => isAttached }));
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

                    const earlierParts = yield* findEarlierParts(transaction, primaryEntry, input.installmentCount, input.totalAmount);
                    const planStartedAt = earlierParts.at(0)?.operatedAt ?? transaction.operatedAt;
                    const [{ count }] = yield* accountRepository.count;
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
                    const activePlanIds = yield* findActivePlanIds();
                    yield* attachPlanDueParts(account.id, activePlanIds);

                    return { accountId: account.id };
                },
                effect => Db.transaction(effect)
            ),
            revertExpense: Effect.fn('InstallmentPlanService.revertExpense')(
                function* (debtAccountId: number) {
                    const account = yield* accountRepository.findById(debtAccountId);

                    if (!isDefined(account) || account.debtType !== AccountDebtTypeEnum.INSTALLMENT) {
                        return;
                    }

                    const parts = yield* installmentPlanRepository.findParts(debtAccountId);

                    yield* Effect.forEach(parts, part => transactionDebtSettlementService.detach(part.transactionId), { discard: true });
                    yield* accountArchiveService.deleteById(debtAccountId);
                },
                effect => Db.transaction(effect)
            ),
            attachDueParts: Effect.fn('InstallmentPlanService.attachDueParts')(
                function* () {
                    const activePlanIds = yield* findActivePlanIds();

                    yield* Effect.forEach(
                        activePlanIds,
                        planId =>
                            cancelRefundedPlan(planId).pipe(
                                Effect.andThen(attachPlanDueParts(planId, activePlanIds)),
                                Effect.andThen(transactionDebtSettlementService.inheritInstallmentCategory(planId))
                            ),
                        { discard: true }
                    );
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(InstallmentPlanService, InstallmentPlanService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            DebtEventRepository.layer,
            InstallmentPlanRepository.layer,
            TransactionRepository.layer,
            AccountArchiveService.layer,
            AccountBalanceIncrementalService.layer,
            TransactionDebtSettlementService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
