import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { expectConsolidationParent, fetchLedgerEntry, fetchSingleCanonicalId } from '../harness/consolidation-revert-audit';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const ERSTE_OPERATED_AT = new Date(Date.now() - 24 * 60 * 60 * 1000);
const ATM_WITHDRAWAL_AMOUNT = 200 * PRECISION;

const seedErsteAndCashAccounts = Effect.fnUntraced(function* () {
    return {
        bankAccount: yield* testSeedService.account({ title: 'Erste EUR', type: AccountTypeEnum.BANK_SYNC }),
        cashAccount: yield* testSeedService.account({ title: 'Cash EUR', type: AccountTypeEnum.CASH })
    };
});

layer(TestLayer)('consolidation/erste-atm-cash-withdrawal', it => {
    it.effect('moves an Erste AUTOMAT withdrawal to the cash account only on request and leaves cash back and deposits unpaired', () =>
        Effect.gen(function* () {
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const { bankAccount, cashAccount } = yield* seedErsteAndCashAccounts();
            const seedErsteTransaction = (title: string, transaction: TransactionEntityInterface) =>
                Effect.gen(function* () {
                    return yield* testSeedService.updateTransaction(transaction.id, { title, externalSource: ExternalSourceEnum.ERSTE });
                });
            const atmWithdrawal = yield* seedErsteTransaction(
                'AUTOMAT 12210014 K1 26.11. 14:51',
                yield* testSeedService.bankPairExpense(
                    { externalId: 'erste-atm', operatedAt: ERSTE_OPERATED_AT },
                    {
                        accountId: bankAccount.id,
                        amount: ATM_WITHDRAWAL_AMOUNT,
                        mccCategoryId: (yield* testQueryService.findMccByCode('6011')).id
                    }
                )
            );
            const unpairedTransactions = [
                yield* seedErsteTransaction(
                    'POS 0,10 Cash 30,00',
                    yield* testSeedService.bankPairExpense(
                        { externalId: 'erste-cash-back', operatedAt: ERSTE_OPERATED_AT },
                        { accountId: bankAccount.id, amount: 30_100_000 }
                    )
                ),
                yield* seedErsteTransaction(
                    'Bareinzahlung',
                    yield* testSeedService.bankPairIncome(
                        { externalId: 'erste-cash-deposit', operatedAt: ERSTE_OPERATED_AT },
                        { accountId: bankAccount.id, amount: 50_000_000 }
                    )
                ),
                yield* seedErsteTransaction(
                    'SB-Münzeinz. K1 S05303 17.08/11:06',
                    yield* testSeedService.bankPairIncome(
                        { externalId: 'erste-coin-deposit', operatedAt: ERSTE_OPERATED_AT },
                        { accountId: bankAccount.id, amount: 97_330_000 }
                    )
                )
            ];

            expect(yield* runConsolidation()).toEqual({ consolidated: 0, found: 0 });
            expect(
                yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([
                    atmWithdrawal.id,
                    ...unpairedTransactions.map(transaction => transaction.id)
                ])
            ).toBe(1);

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

            yield* expectConsolidationParent(atmWithdrawal.id, canonicalId);
            expect((yield* fetchLedgerEntry(canonicalId, cashAccount.id)).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
            expect(
                (yield* Effect.forEach(unpairedTransactions, transaction => testQueryService.fetchTransactionById(transaction.id))).map(
                    transaction => transaction.consolidationParentTransactionId
                )
            ).toEqual([null, null, null]);
        })
    );
    it.effect('moves an Erste AUTOMAT withdrawal imported before the ATM MCC existed, recognised by its title', () =>
        Effect.gen(function* () {
            const { bankAccount, cashAccount } = yield* seedErsteAndCashAccounts();
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const seedMcclessExpense = (externalId: string, title: string, externalSource: ExternalSourceEnum) =>
                Effect.gen(function* () {
                    const expense = yield* testSeedService.bankPairExpense(
                        { externalId, operatedAt: ERSTE_OPERATED_AT },
                        { accountId: bankAccount.id, amount: ATM_WITHDRAWAL_AMOUNT }
                    );

                    return yield* testSeedService.updateTransaction(expense.id, { title, externalSource });
                });
            const legacyAtmWithdrawal = yield* seedMcclessExpense(
                'erste-legacy-atm',
                'AUTOMAT 12210014 K1 26.11. 14:51',
                ExternalSourceEnum.ERSTE
            );
            const otherBankAutomat = yield* seedMcclessExpense(
                'other-bank-automat',
                'AUTOMAT 12210014 K1 26.11. 14:51',
                ExternalSourceEnum.MONOBANK
            );
            const ersteShopping = yield* seedMcclessExpense('erste-shopping', 'AUTOMATENSHOP WIEN 1010', ExternalSourceEnum.ERSTE);

            expect(
                yield* consolidationCoordinatorService.findAtmCashWithdrawalTransactionIds([
                    legacyAtmWithdrawal.id,
                    otherBankAutomat.id,
                    ersteShopping.id
                ])
            ).toEqual([legacyAtmWithdrawal.id]);
            expect(yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash([legacyAtmWithdrawal.id])).toBe(1);

            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL);

            yield* expectConsolidationParent(legacyAtmWithdrawal.id, canonicalId);
            expect((yield* fetchLedgerEntry(canonicalId, cashAccount.id)).amount).toBe(ATM_WITHDRAWAL_AMOUNT);
        })
    );
});
