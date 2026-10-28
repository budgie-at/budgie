import { AccountTypeEnum, BankIntegrationEntityTable, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { AccountArchiveService } from '@budgie/ledger';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountIntegrationToken, fetchSyncById, seed, testDb, TestLayer } from '../../harness';

const GROUP_TOKEN = 'cleanup-group-token';

const seedGroupAccount = (externalId: string) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            externalId,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: AccountTypeEnum.BANK_SYNC,
            instrumentId: 1
        });
        const sync = yield* seed.sync({
            accountId: account.id,
            token: GROUP_TOKEN,
            provider: ExternalSourceEnum.MONOBANK,
            mode: SyncModeEnum.FORWARD
        });

        return { account, sync };
    });

const countMonobankIntegrations = () =>
    Effect.map(
        testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.provider, ExternalSourceEnum.MONOBANK)),
        rows => rows.length
    );

describe('monobank/integration-cleanup', () => {
    it.effect('keeps the shared integration while one account of the group remains and removes it with the last one', () =>
        Effect.gen(function* () {
            const accountArchiveService = yield* AccountArchiveService;
            const first = yield* seedGroupAccount('cleanup-card-first');
            const second = yield* seedGroupAccount('cleanup-card-second');

            yield* accountArchiveService.deleteById(first.account.id);

            expect(yield* countMonobankIntegrations()).toBe(1);
            expect(yield* fetchAccountIntegrationToken(second.account.id)).toBe(GROUP_TOKEN);
            expect(yield* fetchSyncById(second.sync.id)).toMatchObject({ enabled: true, status: SyncStatusEnum.IDLE });

            yield* accountArchiveService.deleteById(second.account.id);

            expect(yield* countMonobankIntegrations()).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
