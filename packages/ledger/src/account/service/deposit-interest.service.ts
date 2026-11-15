import {
    AccountBalanceRepository,
    AccountNotFoundError,
    AccountRepository,
    CategorySourceEnum,
    Db,
    INVESTMENTS_CATEGORY_ID,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionYieldRepository,
    YieldKindEnum,
    YieldRepository,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import { max } from 'date-fns/max';
import { min } from 'date-fns/min';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { DepositCloseAmountInvalidError } from '../error/deposit-close-amount-invalid.error';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { BalanceAdjustmentService } from './balance-adjustment.service';

import type { DepositClosePrefillInterface } from '../interface/deposit-close-prefill.interface';
import type { YieldPositionMovementRowInterface } from '@budgie/contracts';

export class DepositInterestService extends Context.Service<DepositInterestService>()('@budgie/ledger/DepositInterestService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionYieldRepository = yield* TransactionYieldRepository;
        const yieldRepository = yield* YieldRepository;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const plausibleAccrualFactor = 1.5;
        const dayMs = 86_400_000;
        const daysPerYear = 365;
        const percent = 100;
        const centInMicroUnits = 10_000;

        const findDeposit = Effect.fnUntraced(function* (depositAccountId: number) {
            const deposit = yield* accountRepository.findById(depositAccountId);

            if (!isDefined(deposit)) {
                return yield* AccountNotFoundError.make({ id: depositAccountId });
            }

            return deposit;
        });

        const readLedgerBalance = (depositAccountId: number) =>
            Effect.map(accountBalanceRepository.getLedgerBalances([depositAccountId]), balances => balances.get(depositAccountId) ?? 0);

        const accrue = (balance: number, rate: number, from: Date, to: Date) =>
            (balance * (rate / percent) * (Math.max(0, to.getTime() - from.getTime()) / dayMs)) / daysPerYear;

        const accrueOverMovements = (movements: readonly YieldPositionMovementRowInterface[], rate: number, from: Date, to: Date) => {
            let balance = 0;
            let accruedUntil = from;
            let accrual = 0;

            for (const movement of movements.filter(({ operatedAt }) => operatedAt < to)) {
                if (movement.operatedAt > accruedUntil) {
                    accrual += accrue(balance, rate, accruedUntil, movement.operatedAt);
                    accruedUntil = movement.operatedAt;
                }

                balance += movement.amount;
            }

            return accrual + accrue(balance, rate, accruedUntil, to);
        };

        const createInterest = Effect.fnUntraced(function* (depositAccountId: number, amount: number, operatedAt: Date) {
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({ accountId: depositAccountId, amount, operatedAt });
            const transaction = yield* transactionRepository.create({
                type: TransactionTypeEnum.INCOME,
                title: '',
                comment: '',
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                fromAccountId: null,
                toAccountId: depositAccountId,
                updatedBy: null,
                yieldKind: YieldKindEnum.INTEREST,
                yieldSourceAccountId: depositAccountId
            });

            yield* transactionEntryRepository.create({
                accountId: depositAccountId,
                transactionId: transaction.id,
                categoryId: INVESTMENTS_CATEGORY_ID,
                categorySource: CategorySourceEnum.RULE,
                mccCategoryId: null,
                amount,
                type: TransactionEntryTypeEnum.DEBIT,
                exchangeRate: valuation.baseExchangeRate ?? 1,
                baseInstrumentId: valuation.baseInstrumentId,
                baseExchangeRate: valuation.baseExchangeRate,
                baseAmount: valuation.baseAmount
            });
        });

        const recordDelta = Effect.fnUntraced(function* (depositAccountId: number, delta: number, isInterest: boolean, operatedAt: Date) {
            if (delta === 0) {
                return;
            }

            if (isInterest) {
                yield* createInterest(depositAccountId, delta, operatedAt);
            } else {
                yield* balanceAdjustmentService.create(depositAccountId, delta, operatedAt);
            }

            yield* accountBalanceIncrementalService.updateBalancesByAccountIds([depositAccountId]);
        });

        const readTerm = Effect.fnUntraced(function* (depositAccountId: number) {
            const deposit = yield* findDeposit(depositAccountId);
            const timeline = yield* transactionYieldRepository.findDepositYieldTimeline(depositAccountId);

            return { deposit, timeline, termStart: timeline.firstPrincipalAt ?? deposit.createdAt };
        });

        return {
            recordGrowth: Effect.fn('DepositInterestService.recordGrowth')(
                function* (depositAccountId: number, newBalance: number) {
                    const { deposit, timeline } = yield* readTerm(depositAccountId);
                    const ledgerBalance = yield* readLedgerBalance(depositAccountId);
                    const delta = convertToMicroUnits(newBalance) - ledgerBalance;
                    const now = yield* DateTime.nowAsDate;
                    const allowedInterest =
                        plausibleAccrualFactor *
                        accrue(ledgerBalance, deposit.interestRate ?? 0, timeline.lastBalanceEventAt ?? deposit.createdAt, now);

                    yield* recordDelta(depositAccountId, delta, isPositiveNumber(delta) && delta <= allowedInterest, now);
                },
                effect => Db.transaction(effect)
            ),
            recordCloseDelta: Effect.fn('DepositInterestService.recordCloseDelta')(
                function* (depositAccountId: number, amountReceived: number) {
                    if (!Number.isFinite(amountReceived) || amountReceived < 0) {
                        return yield* DepositCloseAmountInvalidError.make();
                    }

                    const ledgerBalance = yield* readLedgerBalance(depositAccountId);
                    const delta = convertToMicroUnits(amountReceived) - ledgerBalance;

                    const now = yield* DateTime.nowAsDate;

                    yield* recordDelta(depositAccountId, delta, isPositiveNumber(delta), now);
                },
                effect => Db.transaction(effect)
            ),
            getClosePrefill: Effect.fn('DepositInterestService.getClosePrefill')(function* (depositAccountId: number) {
                const { deposit, timeline, termStart } = yield* readTerm(depositAccountId);
                const ledgerBalance = yield* readLedgerBalance(depositAccountId);
                const now = yield* DateTime.nowAsDate;
                const accrualStart = max([termStart, timeline.lastInterestAt ?? termStart]);
                const accrualEnd = isDefined(deposit.deadline) ? min([now, deposit.deadline]) : now;
                const movements = yield* yieldRepository.findPositionMovements([depositAccountId]);
                const accrual = accrueOverMovements(movements, deposit.interestRate ?? 0, accrualStart, accrualEnd);
                const expected = ledgerBalance + Math.round(accrual / centInMicroUnits) * centInMicroUnits;
                const unassignedInterestIds = yield* transactionYieldRepository.findUnassignedInterestIds(depositAccountId, termStart);
                const hasUnassignedInterest = isNotEmptyArray(unassignedInterestIds);

                return {
                    ledgerBalance: convertFromMicroUnits(ledgerBalance),
                    amountReceived: convertFromMicroUnits(hasUnassignedInterest ? ledgerBalance : Math.max(ledgerBalance, expected)),
                    hasUnassignedInterest
                } satisfies DepositClosePrefillInterface;
            }),
            linkInterestPayouts: Effect.fn('DepositInterestService.linkInterestPayouts')(
                function* (depositAccountId: number) {
                    const { termStart } = yield* readTerm(depositAccountId);
                    const transactionIds = yield* transactionYieldRepository.findUnassignedInterestIds(depositAccountId, termStart);

                    yield* transactionYieldRepository.linkInterestToDeposit(depositAccountId, transactionIds);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(DepositInterestService, DepositInterestService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            AccountBalanceRepository.layer,
            TransactionRepository.layer,
            TransactionEntryRepository.layer,
            TransactionYieldRepository.layer,
            YieldRepository.layer,
            BalanceAdjustmentService.layer,
            AccountBalanceIncrementalService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
