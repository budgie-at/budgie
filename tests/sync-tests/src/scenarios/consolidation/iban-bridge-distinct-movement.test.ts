import { IbanBridgeTransferRepository } from '@budgie/consolidation';
import { AccountBalanceRepository, ExternalSourceEnum, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { findMccByCode, seed, seedBankPair, seedBankSyncAccount, testDb, TestLayer } from '../../harness';

it.effect.each([false, true])('retains a second real movement with cross-account external ID collision: %s', crossAccountCollision =>
    Effect.gen(function* () {
        const transferMcc = yield* findMccByCode('4829');
        const sourceInstrument = yield* seed.instrument({ code: 'EUR', name: 'Synthetic euro', symbol: 'X' });
        const source = yield* seedBankSyncAccount('Synthetic source', ExternalSourceEnum.MONOBANK, 'UA-SOURCE', sourceInstrument.id);
        const bridge = yield* seedBankSyncAccount('Synthetic bridge', ExternalSourceEnum.MONOBANK, 'UA-BRIDGE');
        const target = yield* seedBankSyncAccount('Synthetic target', ExternalSourceEnum.MONOBANK, 'UA-TARGET');
        const service = yield* TransferConsolidationService;
        const bridgeTransferRepository = yield* IbanBridgeTransferRepository;
        const balances = yield* AccountBalanceRepository;
        const firstTime = new Date(2026, 9, 6, 12);
        const secondTime = new Date(firstTime.getTime() + 30000);
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
        const canonicalBefore = yield* testDb
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
        const candidates = yield* bridgeTransferRepository.findCanonicalDuplicateCandidates(null);
        const result = yield* service.consolidate(null);
        const after = yield* balances.getLedgerBalances([source.id, target.id]);
        expect(candidates).toEqual([]);
        expect(result).toEqual({ found: 1, consolidated: 1 });
        expect(after).toEqual(before);
        const canonicalsAfter = yield* testDb
            .select({ id: TransactionEntityTable.id })
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.type, TransactionTypeEnum.TRANSFER));
        const outerParents = yield* testDb
            .select({ parent: TransactionEntityTable.consolidationParentTransactionId })
            .from(TransactionEntityTable)
            .where(inArray(TransactionEntityTable.id, [secondExpense.id, secondIncome.id]));
        expect(canonicalsAfter).toHaveLength(2);
        expect(outerParents[0]?.parent).not.toBe(canonicalBefore[0]?.id);
        expect(outerParents[0]?.parent).toBe(outerParents[1]?.parent);
        expect(
            yield* testDb.$client.unsafe('SELECT account_id,amount FROM account_balances WHERE account_id IN (?,?) ORDER BY account_id', [
                source.id,
                target.id
            ])
        ).toEqual([
            { account_id: source.id, amount: -200 * PRECISION },
            { account_id: target.id, amount: 1000 * PRECISION }
        ]);
        expect(
            yield* testDb
                .select({ id: TransactionEntityTable.id, externalId: TransactionEntityTable.externalId })
                .from(TransactionEntityTable)
                .where(inArray(TransactionEntityTable.id, [secondExpense.id, secondIncome.id]))
        ).toEqual([
            { id: secondExpense.id, externalId: secondExpense.externalId },
            { id: secondIncome.id, externalId: secondIncome.externalId }
        ]);
        expect(yield* service.consolidate(null)).toEqual({ found: 0, consolidated: 0 });
        expect(yield* balances.getLedgerBalances([source.id, target.id])).toEqual(before);
    }).pipe(Effect.provide([IbanBridgeTransferRepository.layer, TestLayer]))
);
