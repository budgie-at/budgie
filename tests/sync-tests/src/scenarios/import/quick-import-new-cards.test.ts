import { AccountEntityTable, ExternalSourceEnum, SyncEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { ExternalAccountService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, TestLayer } from '../../harness';
import {
    buildOwnCardRow,
    fetchVisibleTransactions,
    summarize,
    makeOwnCardStatementService,
    buildOwnCardStatementClient,
    seedOwnCard
} from '../../harness/file-sync/privatbank-own-card-statement';

import type { PrivatbankRowInterface } from '@budgie/sync';

const KNOWN_CARD = '4000 **** **** 8522';
const NEW_CARD = '4000 **** **** 1111';
const ARCHIVED_CARD = '4000 **** **** 2222';
const EXTERNAL_CARD = '4000 **** **** 9174';
const STATEMENT_URI = 'privatbank-statement.xlsx';

const makeService = (rows: PrivatbankRowInterface[]) => makeOwnCardStatementService(buildOwnCardStatementClient(rows));

const findAccountsByExternalId = (externalId: string) =>
    testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, externalId));

describe('import/quick-import-new-cards', () => {
    it.effect('creates an unknown own card with its sync and pairs its transfer with the known card', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const knownCard = yield* seedOwnCard(KNOWN_CARD);

            yield* seed.sync({ accountId: knownCard.id, provider: ExternalSourceEnum.PRIVATBANK });
            const syncService = yield* makeService([
                buildOwnCardRow(KNOWN_CARD, 500, 'Зі своєї картки *1111'),
                buildOwnCardRow(NEW_CARD, -500, 'На мою картку *8522'),
                buildOwnCardRow(NEW_CARD, -70, 'Coffee')
            ]);

            const result = yield* syncService.quickImport(STATEMENT_URI);
            yield* transferConsolidationService.consolidate(null);

            const [newCard] = yield* findAccountsByExternalId(NEW_CARD);
            const visible = yield* fetchVisibleTransactions();

            expect(result).toMatchObject({ accountCount: 2, createdAccountCount: 1, newTransactionCount: 3 });
            expect(newCard).toBeDefined();
            expect(yield* testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.accountId, newCard.id))).toHaveLength(1);
            expect(summarize(visible)).toEqual(
                expect.arrayContaining([
                    [TransactionTypeEnum.TRANSFER, newCard.id, knownCard.id],
                    [TransactionTypeEnum.EXPENSE, newCard.id, null]
                ])
            );
            expect(visible).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not recreate an archived card and keeps skipping an external card', () =>
        Effect.gen(function* () {
            const externalAccountService = yield* ExternalAccountService;
            const archivedCard = yield* seedOwnCard(ARCHIVED_CARD);
            const externalCard = yield* seedOwnCard(EXTERNAL_CARD);
            const liveCard = yield* seedOwnCard(KNOWN_CARD);

            yield* seed.sync({ accountId: liveCard.id, provider: ExternalSourceEnum.PRIVATBANK });
            yield* testDb.update(AccountEntityTable).set({ deletedAt: new Date() }).where(eq(AccountEntityTable.id, archivedCard.id));
            yield* externalAccountService.markExternal(externalCard.id);
            const syncService = yield* makeService([
                buildOwnCardRow(ARCHIVED_CARD, -10, 'Coffee'),
                buildOwnCardRow(EXTERNAL_CARD, -20, 'Tea'),
                buildOwnCardRow(KNOWN_CARD, -30, 'Bread')
            ]);

            const result = yield* syncService.quickImport(STATEMENT_URI);

            expect(result).toMatchObject({ accountCount: 1, createdAccountCount: 0, newTransactionCount: 1 });
            expect(yield* findAccountsByExternalId(ARCHIVED_CARD)).toHaveLength(1);
            expect(yield* findAccountsByExternalId(EXTERNAL_CARD)).toHaveLength(1);
            expect(yield* testDb.select().from(AccountEntityTable).where(isNull(AccountEntityTable.deletedAt))).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
