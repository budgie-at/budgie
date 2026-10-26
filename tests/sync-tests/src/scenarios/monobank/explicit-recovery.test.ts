import { AccountTypeEnum, ExternalSourceEnum, SyncModeEnum, SyncRepository, SyncStatusEnum } from '@budgie/contracts';
import { ResyncService } from '@budgie/sync';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { fetchSyncById, MonobankSyncService, seed, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { Services } from '../../harness/scenario/test-runtime';

const seedPausedAccount = Effect.fnUntraced(function* (externalId: string) {
    const account = yield* seed.account({ externalId, type: AccountTypeEnum.BANK_SYNC, externalSource: ExternalSourceEnum.MONOBANK });

    return yield* seed.sync({
        accountId: account.id,
        provider: ExternalSourceEnum.MONOBANK,
        token: 'shared-token',
        enabled: false,
        status: SyncStatusEnum.FAILED,
        errorCount: 3,
        lastError: 'Unauthorized',
        mode: SyncModeEnum.FORWARD,
        forwardSyncFromAt: new Date(Date.now() - 86_400_000)
    });
});

describe('monobank/explicit-recovery', () => {
    afterEach(() => vi.restoreAllMocks());

    it.effect.each([null, 7])(
        'resync enables and clears only the selected paused row before requesting actual polling (days: %s)',
        sinceDays =>
            Effect.gen(function* () {
                const service = yield* MonobankSyncService;
                const context = yield* Effect.context<Services>();
                const resync = yield* ResyncService;
                const selected = yield* seedPausedAccount('mono-selected');
                const sibling = yield* seedPausedAccount('mono-paused-sibling');
                let statements = 0;
                vi.spyOn(service, 'fetchSetupBalance').mockReturnValue(Effect.succeed(0));
                vi.spyOn(service, 'requestSync').mockImplementation(() =>
                    Effect.gen(function* () {
                        expect(yield* fetchSyncById(selected.id)).toMatchObject({
                            enabled: true,
                            status: SyncStatusEnum.IDLE,
                            errorCount: 0,
                            lastError: null
                        });
                        yield* service.sync();
                    }).pipe(Effect.provide(context), Effect.orDie)
                );
                mockServer.use(
                    http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', ({ params }) => {
                        expect(params['account']).toBe('mono-selected');
                        statements += 1;

                        return HttpResponse.json([]);
                    })
                );

                yield* resync.resync({ accountId: selected.accountId, sinceDays });

                expect(statements).toBeGreaterThan(0);
                expect((yield* fetchSyncById(selected.id)).enabled).toBe(true);
                expect(yield* fetchSyncById(sibling.id)).toEqual(sibling);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs a disabled selected account without enabling its paused credential sibling', () =>
        Effect.gen(function* () {
            const service = yield* MonobankSyncService;
            const selected = yield* seedPausedAccount('mono-selected');
            const sibling = yield* seedPausedAccount('mono-paused-sibling');
            const repository = yield* SyncRepository;
            yield* service.updateAccountToken(selected.accountId, 'repaired-token');
            const recovered = yield* repository.getByAccountId(selected.accountId);

            expect(recovered).toMatchObject({ enabled: true, errorCount: 0, lastError: null });
            expect(recovered?.forwardSyncFromAt).toEqual(selected.forwardSyncFromAt);
            expect(yield* fetchSyncById(sibling.id)).toMatchObject({
                enabled: false,
                status: SyncStatusEnum.FAILED,
                forwardSyncFromAt: sibling.forwardSyncFromAt
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
