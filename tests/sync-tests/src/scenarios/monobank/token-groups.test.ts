import { AccountTypeEnum, BankIntegrationEntityTable, ExternalSourceEnum, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { MonobankConnectionResultEnum, SyncProviderRegistryService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { http, HttpResponse } from 'msw';

import {
    buildMonobank,
    expectSyncFailedAndDisabled,
    fetchAccountIntegrationToken,
    fetchSyncById,
    MonobankSyncService,
    monobankStub,
    seed,
    skipRequestedSync,
    TestLayer,
    testDb
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { SyncCreateEntityInterface } from '@budgie/contracts';

const GROUP_A_TOKEN = 'group-a-token';
const GROUP_B_TOKEN = 'group-b-token';
const ROTATED_TOKEN = 'group-a-rotated-token';
const NEW_CONNECTION_TOKEN = 'new-connection-token';
const CLIENT_NAME = 'Ivan Petrenko';
const USER_LABEL = 'Family';
const CLIENT_INFO_ENDPOINT = 'https://api.monobank.ua/personal/client-info';

const fetchIntegration = (integrationId: number) =>
    Effect.map(
        testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.id, integrationId)),
        ([integration]) => integration
    );

const seedGroupAccount = (externalId: string, token: string, syncState: Partial<SyncCreateEntityInterface> = {}) =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            externalId,
            externalSource: ExternalSourceEnum.MONOBANK,
            type: AccountTypeEnum.BANK_SYNC,
            instrumentId: 1
        });
        const sync = yield* seed.sync({
            accountId: account.id,
            token,
            provider: ExternalSourceEnum.MONOBANK,
            mode: SyncModeEnum.FORWARD,
            ...syncState
        });

        return { account, sync };
    });

const seedTwoTokenGroups = () =>
    Effect.gen(function* () {
        const groupA = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, token: GROUP_A_TOKEN });
        const groupB = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, token: GROUP_B_TOKEN });
        const failedState = { status: SyncStatusEnum.FAILED, enabled: false, errorCount: 3, lastError: 'Unauthorized' };

        return {
            groupA,
            groupB,
            failedInGroupA: yield* seedGroupAccount('group-a-failed', GROUP_A_TOKEN, failedState),
            pausedInGroupA: yield* seedGroupAccount('group-a-paused', GROUP_A_TOKEN, { enabled: false }),
            failedInGroupB: yield* seedGroupAccount('group-b-failed', GROUP_B_TOKEN, failedState)
        };
    });

describe('monobank/token-groups', () => {
    it.effect('rejects a new connection whose token already backs a Monobank group', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { groupA } = yield* seedTwoTokenGroups();

            const error = yield* Effect.flip(monobankSyncService.fetchNewConnectionAccountsPreview(GROUP_A_TOKEN));

            expect(error).toMatchObject({
                _tag: 'SyncTokenAlreadyConnectedError',
                provider: ExternalSourceEnum.MONOBANK,
                integrationId: groupA.id
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lists account previews for a token whose accounts no group owns yet', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* seedTwoTokenGroups();
            monobankStub.clientInfo(buildMonobank.clientInfoWith(['new-card']));

            const result = yield* monobankSyncService.fetchNewConnectionAccountsPreview(NEW_CONNECTION_TOKEN);

            expect(result.kind).toBe(MonobankConnectionResultEnum.PREVIEWS);
            expect(result.kind === MonobankConnectionResultEnum.PREVIEWS ? result.previews.map(preview => preview.externalId) : []).toEqual(
                ['new-card']
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('treats a new token for accounts of an existing group as that group key rotation', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const scenario = yield* seedTwoTokenGroups();
            monobankStub.clientInfo({ ...buildMonobank.clientInfoWith(['group-a-failed', 'new-card']), name: CLIENT_NAME });

            const result = yield* skipRequestedSync(monobankSyncService.fetchNewConnectionAccountsPreview(ROTATED_TOKEN));

            expect(result).toEqual({ kind: MonobankConnectionResultEnum.TOKEN_ROTATED, integrationId: scenario.groupA.id });
            expect(yield* fetchIntegration(scenario.groupA.id)).toMatchObject({ token: ROTATED_TOKEN, label: CLIENT_NAME });
            expect(yield* fetchSyncById(scenario.failedInGroupA.sync.id)).toMatchObject({ enabled: true, errorCount: 0 });
            expect(yield* testDb.select().from(BankIntegrationEntityTable)).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores the Monobank client name as the label of a group created on setup', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const { account } = yield* seedGroupAccount('group-a-failed', GROUP_A_TOKEN);
            monobankStub.clientInfo({ ...buildMonobank.clientInfoWith(['setup-card']), name: CLIENT_NAME });

            yield* skipRequestedSync(monobankSyncService.setupAccountSyncBatch(NEW_CONNECTION_TOKEN, ['setup-card']));

            const integrations = yield* testDb
                .select()
                .from(BankIntegrationEntityTable)
                .where(eq(BankIntegrationEntityTable.token, NEW_CONNECTION_TOKEN));
            expect(integrations.map(integration => integration.label)).toEqual([CLIENT_NAME]);
            expect(yield* fetchAccountIntegrationToken(account.id)).toBe(GROUP_A_TOKEN);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the current token when Monobank rejects the new key', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const scenario = yield* seedTwoTokenGroups();
            mockServer.use(http.get(CLIENT_INFO_ENDPOINT, () => new HttpResponse(null, { status: 403 })));

            const error = yield* Effect.flip(registry.updateIntegrationToken(scenario.groupA.id, ROTATED_TOKEN));

            expect(error._tag).toBe('SyncUnauthorizedError');
            expect(yield* fetchIntegration(scenario.groupA.id)).toMatchObject({ token: GROUP_A_TOKEN });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a key whose client owns none of the group accounts', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const scenario = yield* seedTwoTokenGroups();
            monobankStub.clientInfo(buildMonobank.clientInfoWith(['someone-else-card']));

            const error = yield* Effect.flip(registry.updateIntegrationToken(scenario.groupA.id, ROTATED_TOKEN));

            expect(error).toMatchObject({ _tag: 'SyncTokenClientMismatchError', integrationId: scenario.groupA.id });
            expect(yield* fetchIntegration(scenario.groupA.id)).toMatchObject({ token: GROUP_A_TOKEN });
            expect(yield* fetchSyncById(scenario.failedInGroupA.sync.id)).toMatchObject({ enabled: false, errorCount: 3 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fills a missing label from the client name on key update and keeps a user label', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const scenario = yield* seedTwoTokenGroups();
            monobankStub.clientInfo({ ...buildMonobank.clientInfoWith(['group-a-failed']), name: CLIENT_NAME });

            yield* skipRequestedSync(registry.updateIntegrationToken(scenario.groupA.id, ROTATED_TOKEN));
            expect(yield* fetchIntegration(scenario.groupA.id)).toMatchObject({ label: CLIENT_NAME });

            yield* registry.renameIntegration(scenario.groupA.id, USER_LABEL);
            yield* skipRequestedSync(registry.updateIntegrationToken(scenario.groupA.id, NEW_CONNECTION_TOKEN));
            expect(yield* fetchIntegration(scenario.groupA.id)).toMatchObject({ token: NEW_CONNECTION_TOKEN, label: USER_LABEL });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('renames a group and clears its label', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const { groupA, groupB } = yield* seedTwoTokenGroups();

            yield* registry.renameIntegration(groupA.id, ` ${USER_LABEL} `);
            expect(yield* fetchIntegration(groupA.id)).toMatchObject({ label: USER_LABEL });
            expect(yield* fetchIntegration(groupB.id)).toMatchObject({ label: null });

            yield* registry.renameIntegration(groupA.id, '  ');
            expect(yield* fetchIntegration(groupA.id)).toMatchObject({ label: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rotates the group token, re-enables its failure-disabled syncs and leaves user-paused syncs and other groups alone', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const scenario = yield* seedTwoTokenGroups();
            monobankStub.clientInfo(buildMonobank.clientInfoWith(['group-a-failed', 'group-a-paused']));

            yield* skipRequestedSync(registry.updateIntegrationToken(scenario.groupA.id, ROTATED_TOKEN));

            expect(yield* fetchAccountIntegrationToken(scenario.failedInGroupA.account.id)).toBe(ROTATED_TOKEN);
            expect(yield* fetchAccountIntegrationToken(scenario.pausedInGroupA.account.id)).toBe(ROTATED_TOKEN);
            expect(yield* fetchAccountIntegrationToken(scenario.failedInGroupB.account.id)).toBe(GROUP_B_TOKEN);
            expect(yield* fetchSyncById(scenario.failedInGroupA.sync.id)).toMatchObject({
                enabled: true,
                status: SyncStatusEnum.IDLE,
                errorCount: 0,
                lastError: null
            });
            expect(yield* fetchSyncById(scenario.pausedInGroupA.sync.id)).toMatchObject({
                enabled: false,
                status: SyncStatusEnum.IDLE
            });
            expect(yield* fetchSyncById(scenario.failedInGroupB.sync.id)).toMatchObject({
                enabled: false,
                status: SyncStatusEnum.FAILED,
                errorCount: 3
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects a token that another group owns and keeps the current token', () =>
        Effect.gen(function* () {
            const registry = yield* SyncProviderRegistryService;
            const scenario = yield* seedTwoTokenGroups();

            const error = yield* Effect.flip(registry.updateIntegrationToken(scenario.groupA.id, GROUP_B_TOKEN));

            expect(error).toMatchObject({ _tag: 'SyncTokenAlreadyConnectedError', integrationId: scenario.groupB.id });
            expect(yield* fetchAccountIntegrationToken(scenario.failedInGroupA.account.id)).toBe(GROUP_A_TOKEN);
            expect(yield* fetchSyncById(scenario.failedInGroupA.sync.id)).toMatchObject({ enabled: false, errorCount: 3 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('disables every sync of a group on 401 and keeps another Monobank group enabled', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const first = yield* seedGroupAccount('group-a-first', GROUP_A_TOKEN);
            const second = yield* seedGroupAccount('group-a-second', GROUP_A_TOKEN);
            const other = yield* seedGroupAccount('group-b-only', GROUP_B_TOKEN);
            mockServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', ({ request }) =>
                    request.headers.get('X-Token') === GROUP_A_TOKEN ? new HttpResponse(null, { status: 401 }) : HttpResponse.json([])
                )
            );

            yield* monobankSyncService.sync();

            yield* expectSyncFailedAndDisabled(first.sync.id, 0);
            expect(yield* fetchSyncById(second.sync.id)).toMatchObject({ enabled: false, status: SyncStatusEnum.FAILED });
            expect(yield* fetchSyncById(other.sync.id)).toMatchObject({ enabled: true });
        }).pipe(Effect.provide(TestLayer))
    );
});
