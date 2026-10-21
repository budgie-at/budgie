import { ConsolidationCandidateRepository } from '@budgie/consolidation';
import { AccountBalanceRepository, ExternalSourceEnum, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, seedBankPair, seedBankSyncAccount, testDb, TestLayer, testQueryService } from '../../harness';

it.effect.each(
    [false, true].flatMap(crossAccountCollision => [0, 30000, 60000].map(gapMilliseconds => ({ crossAccountCollision, gapMilliseconds })))
)(
    'claims bridge-addressed end legs into the bridge canonical (collision $crossAccountCollision, gap $gapMilliseconds ms)',
    ({ crossAccountCollision, gapMilliseconds }) =>
        Effect.gen(function* () {
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const sourceInstrument = yield* seed.instrument({ code: 'EUR', name: 'Synthetic euro', symbol: 'X' });
            const source = yield* seedBankSyncAccount('Synthetic source', ExternalSourceEnum.MONOBANK, 'UA-SOURCE', sourceInstrument.id);
            const bridge = yield* seedBankSyncAccount('Synthetic bridge', ExternalSourceEnum.MONOBANK, 'UA-BRIDGE');
            const target = yield* seedBankSyncAccount('Synthetic target', ExternalSourceEnum.MONOBANK, 'UA-TARGET');
            const service = yield* TransferConsolidationService;
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const balances = yield* AccountBalanceRepository;
            const firstTime = new Date(2026, 9, 6, 12);
            const secondTime = new Date(firstTime.getTime() + gapMilliseconds);
            yield* seedBankPair.income(
                { externalId: 'real-transfer-1-bridge-income', operatedAt: firstTime },
                { accountId: bridge.id, amount: 500 * PRECISION, exchangeRate: 5, toIban: 'UA-SOURCE', mccCategoryId: transferMcc.id }
            );
            yield* seedBankPair.expense(
                { externalId: 'real-transfer-1-bridge-expense', operatedAt: firstTime },
                { accountId: bridge.id, amount: 500 * PRECISION, toIban: 'UA-TARGET', mccCategoryId: transferMcc.id }
            );
            expect(yield* service.consolidate(null)).toEqual({ found: 1, consolidated: 1 });
            const secondExpense = yield* seedBankPair.expense(
                {
                    externalId: crossAccountCollision ? 'real-transfer-1-bridge-expense' : 'real-transfer-2-source-expense',
                    operatedAt: secondTime
                },
                { accountId: source.id, amount: 100 * PRECISION, toIban: 'UA-BRIDGE', mccCategoryId: transferMcc.id }
            );
            const secondIncome = yield* seedBankPair.income(
                {
                    externalId: crossAccountCollision ? 'real-transfer-1-bridge-income' : 'real-transfer-2-target-income',
                    operatedAt: secondTime
                },
                { accountId: target.id, amount: 500 * PRECISION, mccCategoryId: transferMcc.id }
            );
            const canonicalIdsBefore = yield* testDb
                .select({ id: TransactionEntityTable.id })
                .from(TransactionEntityTable)
                .where(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER));
            yield* testDb
                .update(TransactionEntityTable)
                .set({ title: 'Own account transfer' })
                .where(inArray(TransactionEntityTable.id, [secondExpense.id, secondIncome.id]));
            const before = yield* balances.getLedgerBalances([source.id, target.id]);
            expect(before).toEqual(
                new Map([
                    [source.id, -200 * PRECISION],
                    [target.id, 1000 * PRECISION]
                ])
            );
            const candidates = yield* consolidationCandidateRepository.findIbanBridgeCanonicalDuplicateCandidates(null);
            const result = yield* service.consolidate(null);
            const [bridgeCanonical] = canonicalIdsBefore;
            const claimedBalances = new Map([
                [source.id, -100 * PRECISION],
                [target.id, 500 * PRECISION]
            ]);
            expect(candidates).toEqual([]);
            expect(result).toEqual({ found: 2, consolidated: 2 });
            expect(yield* balances.getLedgerBalances([source.id, target.id])).toEqual(claimedBalances);
            expect(
                yield* testDb
                    .select({ id: TransactionEntityTable.id })
                    .from(TransactionEntityTable)
                    .where(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER))
            ).toEqual(canonicalIdsBefore);
            const endLegParents = yield* testDb
                .select({ id: TransactionEntityTable.id, parent: TransactionEntityTable.consolidationParentTransactionId })
                .from(TransactionEntityTable)
                .where(inArray(TransactionEntityTable.id, [secondExpense.id, secondIncome.id]));
            expect(new Map(endLegParents.map(leg => [leg.id, leg.parent]))).toEqual(
                new Map([
                    [secondExpense.id, bridgeCanonical.id],
                    [secondIncome.id, bridgeCanonical.id]
                ])
            );
            expect(
                yield* testDb.$client.unsafe(
                    'SELECT account_id,amount FROM account_balances WHERE account_id IN (?,?) ORDER BY account_id',
                    [source.id, target.id]
                )
            ).toEqual([
                { account_id: source.id, amount: -100 * PRECISION },
                { account_id: target.id, amount: 500 * PRECISION }
            ]);
            expect(yield* service.consolidate(null)).toEqual({ found: 0, consolidated: 0 });
            expect(yield* balances.getLedgerBalances([source.id, target.id])).toEqual(claimedBalances);
        }).pipe(Effect.provide([ConsolidationCandidateRepository.layer, TestLayer]))
);
