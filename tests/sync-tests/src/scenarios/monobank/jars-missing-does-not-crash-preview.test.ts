import { MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import { buildMonobank, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { ClientInfo } from '@liaugust/monobank-sdk';

describe('monobank/jars-missing-does-not-crash-preview', () => {
    it.effect('lists accounts without throwing when the client-info response omits jars entirely', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const clientInfoWithoutJars: Omit<ClientInfo, 'jars'> = {
                clientId: 'c1',
                name: 'Test',
                webHookUrl: '',
                permissions: 'sp',
                accounts: [buildMonobank.account({ id: 'mono-card' })]
            };
            mockServer.use(http.get('https://api.monobank.ua/personal/client-info', () => HttpResponse.json(clientInfoWithoutJars)));

            const previews = yield* monobankSyncService.fetchAccountsPreview('test-token');

            expect(previews).toHaveLength(1);
            expect(previews[0]?.externalId).toBe('mono-card');
            expect(previews.some(preview => preview.type === SyncAccountTypeEnum.JAR)).toBe(false);
        }).pipe(Effect.provide(TestLayer))
    );
});
