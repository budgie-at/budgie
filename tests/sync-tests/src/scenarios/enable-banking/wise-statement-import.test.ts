import { ExternalSourceEnum, TransactionConsolidationTypeEnum, TransactionEntityTable } from '@budgie/contracts';
import { LedgerWorkload, TransferConsolidationService } from '@budgie/ledger';
import { SyncFileReader, WiseStatementImportService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { fetchAccountBalance, freezeDateClock, testDb, TestLayer, testQueryService } from '../../harness';
import { readWiseStatement, WISE_STATEMENT } from '../../harness/enable-banking/wise-fixture';
import { connectWise } from '../../harness/enable-banking/wise-scenario';

import type { AccountEntityInterface } from '@budgie/contracts';

const wiseStatementLayer = Layer.fresh(WiseStatementImportService.layer).pipe(
    Layer.provide(
        Layer.succeed(SyncFileReader, {
            readPdfTextItems: () => Effect.succeed([]),
            readBytes: () => Effect.succeed(new Uint8Array()),
            readText: uri => Effect.succeed(readWiseStatement(uri))
        })
    ),
    Layer.provide(Layer.succeed(LedgerWorkload, LedgerWorkload.of({ runForeground: effect => effect }))),
    Layer.provideMerge(TestLayer)
);

const importStatement = (account: Pick<AccountEntityInterface, 'integrationId'>, fileName: string) =>
    Effect.flatMap(WiseStatementImportService, service => service.importForIntegration(fileName, account.integrationId ?? 0));

const fetchWiseExternalIds = (account: Pick<AccountEntityInterface, 'id'>) =>
    Effect.map(
        testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.WISE)),
        rows =>
            rows
                .filter(row => row.fromAccountId === account.id || row.toAccountId === account.id)
                .map(row => row.externalId ?? '')
                .sort((left, right) => left.localeCompare(right))
    );

describe('enable-banking/wise-statement-import', () => {
    freezeDateClock(new Date('2023-03-20T12:00:00.000Z'));

    it.effect('imports rows older than the first live day of each balance and drops the boundary day', () =>
        Effect.gen(function* () {
            const { eurAccount, usdAccount } = yield* connectWise;
            const eurBalanceBefore = yield* fetchAccountBalance(eurAccount.id);
            const usdBalanceBefore = yield* fetchAccountBalance(usdAccount.id);

            const eurResult = yield* importStatement(eurAccount, WISE_STATEMENT.EUR);
            const usdResult = yield* importStatement(eurAccount, WISE_STATEMENT.USD);

            expect(eurResult).toMatchObject({ accountCount: 2, newTransactionCount: 6, skippedTransactionCount: 0 });
            expect(usdResult).toMatchObject({ accountCount: 2, newTransactionCount: 3, skippedTransactionCount: 0 });
            expect(yield* fetchWiseExternalIds(eurAccount)).toEqual([
                'BALANCE-1000005:in',
                'CARD-1000002',
                'CARD-1000011',
                'FEE-TRANSFER-1000003',
                'TRANSFER-1000001',
                'TRANSFER-1000003'
            ]);
            expect(yield* fetchWiseExternalIds(usdAccount)).toEqual(['BALANCE-1000005:out', 'FEE-BALANCE-1000005', 'TRANSFER-1000004']);
            expect(yield* fetchAccountBalance(eurAccount.id)).toBe(eurBalanceBefore);
            expect(yield* fetchAccountBalance(usdAccount.id)).toBe(usdBalanceBefore);
        }).pipe(Effect.provide(wiseStatementLayer))
    );

    it.effect('imports a payment created the day before the first live day and booked on it once, matched by amount and direction', () =>
        Effect.gen(function* () {
            const { eurAccount } = yield* connectWise;
            const eurBalanceBefore = yield* fetchAccountBalance(eurAccount.id);

            const result = yield* importStatement(eurAccount, WISE_STATEMENT.STRADDLE);

            expect(result).toMatchObject({ newTransactionCount: 2, skippedTransactionCount: 0 });
            expect(yield* fetchWiseExternalIds(eurAccount)).toEqual(['CARD-2000002', 'TRANSFER-2000003']);
            expect(yield* fetchAccountBalance(eurAccount.id)).toBe(eurBalanceBefore);
        }).pipe(Effect.provide(wiseStatementLayer))
    );

    it.effect('counts rows without a connected balance as skipped and imports nothing from a header-only file', () =>
        Effect.gen(function* () {
            const { eurAccount } = yield* connectWise;

            const gbpResult = yield* importStatement(eurAccount, WISE_STATEMENT.GBP);
            const headerOnlyResult = yield* importStatement(eurAccount, WISE_STATEMENT.HEADER_ONLY);

            expect(gbpResult).toMatchObject({ accountCount: 2, newTransactionCount: 0, skippedTransactionCount: 1 });
            expect(headerOnlyResult).toMatchObject({ accountCount: 2, newTransactionCount: 0, skippedTransactionCount: 0 });
            expect(yield* fetchWiseExternalIds(eurAccount)).toEqual([]);
        }).pipe(Effect.provide(wiseStatementLayer))
    );

    it.effect('importing the same file again adds nothing', () =>
        Effect.gen(function* () {
            const { eurAccount } = yield* connectWise;
            yield* importStatement(eurAccount, WISE_STATEMENT.EUR);

            const again = yield* importStatement(eurAccount, WISE_STATEMENT.EUR);

            expect(again).toMatchObject({ newTransactionCount: 0, existingTransactionCount: 6 });
            expect(yield* fetchWiseExternalIds(eurAccount)).toHaveLength(6);
        }).pipe(Effect.provide(wiseStatementLayer))
    );

    it.effect('the conversion legs consolidate into one transfer between the two balances', () =>
        Effect.gen(function* () {
            const { eurAccount, usdAccount } = yield* connectWise;
            yield* importStatement(eurAccount, WISE_STATEMENT.EUR);
            yield* importStatement(usdAccount, WISE_STATEMENT.USD);

            yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals.map(({ fromAccountId, toAccountId }) => [fromAccountId, toAccountId])).toContainEqual([
                usdAccount.id,
                eurAccount.id
            ]);
            expect(canonicals).toHaveLength(2);
        }).pipe(Effect.provide(wiseStatementLayer))
    );
});
