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
    convertToMicroUnits
} from '@budgie/contracts';
import { EntryBaseValuationService } from '@budgie/market';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from './account-balance-incremental.service';
import { BalanceAdjustmentService } from './balance-adjustment.service';

export class DepositInterestService extends Context.Service<DepositInterestService>()('@budgie/ledger/DepositInterestService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionYieldRepository = yield* TransactionYieldRepository;
        const balanceAdjustmentService = yield* BalanceAdjustmentService;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const plausibleAccrualFactor = 1.5;
        const dayMs = 86_400_000;
        const daysPerYear = 365;
        const percent = 100;

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

        return {
            recordGrowth: Effect.fn('DepositInterestService.recordGrowth')(
                function* (depositAccountId: number, newBalance: number) {
                    const deposit = yield* accountRepository.findById(depositAccountId);

                    if (!isDefined(deposit)) {
                        return yield* AccountNotFoundError.make({ id: depositAccountId });
                    }

                    const ledgerBalances = yield* accountBalanceRepository.getLedgerBalances([depositAccountId]);
                    const ledgerBalance = ledgerBalances.get(depositAccountId) ?? 0;
                    const delta = convertToMicroUnits(newBalance) - ledgerBalance;

                    if (delta === 0) {
                        return;
                    }

                    const lastBalanceEventAt = yield* transactionYieldRepository.findLastDepositBalanceEventAt(depositAccountId);
                    const now = yield* DateTime.nowAsDate;

                    const elapsedDays = Math.max(0, now.getTime() - (lastBalanceEventAt ?? deposit.createdAt).getTime()) / dayMs;
                    const allowedInterest =
                        (plausibleAccrualFactor * ledgerBalance * ((deposit.interestRate ?? 0) / percent) * elapsedDays) / daysPerYear;

                    if (isPositiveNumber(delta) && delta <= allowedInterest) {
                        yield* createInterest(depositAccountId, delta, now);
                    } else {
                        yield* balanceAdjustmentService.create(depositAccountId, delta, now);
                    }

                    yield* accountBalanceIncrementalService.updateBalancesByAccountIds([depositAccountId]);
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
            BalanceAdjustmentService.layer,
            AccountBalanceIncrementalService.layer,
            EntryBaseValuationService.layer
        ])
    );
}
