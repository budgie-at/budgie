import { MonobankSyncService, SyncAccountTypeEnum } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildMonobank, monobankStub, TestLayer } from '../../harness';

import type { ClientInfo } from '@liaugust/monobank-sdk';

describe('monobank/jars-listed-in-preview', () => {
    it.effect('surfaces jars from client-info as selectable jar previews alongside cards', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const clientInfo: ClientInfo = {
                ...buildMonobank.clientInfoWith(['mono-card']),
                jars: [buildMonobank.jar({ id: 'jar-1', title: 'Студія' })]
            };
            monobankStub.clientInfo(clientInfo);

            const previews = yield* monobankSyncService.fetchAccountsPreview('test-token');

            const jarPreview = previews.find(preview => preview.type === SyncAccountTypeEnum.JAR);
            const cardPreview = previews.find(preview => preview.type !== SyncAccountTypeEnum.JAR);

            expect(jarPreview?.externalId).toBe('jar-1');
            expect(jarPreview?.title).toContain('Студія');
            expect(cardPreview?.externalId).toBe('mono-card');
        }).pipe(Effect.provide(TestLayer))
    );
});
