import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { SyncProviderRegistryService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { http, HttpResponse } from 'msw';

import { buildMonobank, MonobankSyncService, seed, skipRequestedSync, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const PREVIOUS_KEY = 'cache-previous-key';
const NEXT_KEY = 'cache-next-key';

const countClientInfoRequests = (accountIdsByToken: Readonly<Record<string, string[]>>) => {
    const requestedTokens: string[] = [];
    mockServer.use(
        http.get('https://api.monobank.ua/personal/client-info', ({ request }) => {
            const token = request.headers.get('X-Token') ?? '';
            requestedTokens.push(token);

            return HttpResponse.json(buildMonobank.clientInfoWith(accountIdsByToken[token] ?? []));
        })
    );

    return requestedTokens;
};

describe('monobank/client-info-cache', () => {
    it.effect('serves back-to-back previews and the following setup from one client-info request', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const requestedTokens = countClientInfoRequests({ [PREVIOUS_KEY]: ['cached-card'] });

            const firstPreviews = yield* monobankSyncService.fetchAccountsPreview(PREVIOUS_KEY);
            const secondPreviews = yield* monobankSyncService.fetchAccountsPreview(PREVIOUS_KEY);
            expect(requestedTokens).toEqual([PREVIOUS_KEY]);
            expect(secondPreviews).toEqual(firstPreviews);

            yield* skipRequestedSync(monobankSyncService.setupAccountSyncBatch(PREVIOUS_KEY, ['cached-card']));
            expect(requestedTokens).toEqual([PREVIOUS_KEY]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('lists the new key accounts after the group key is updated', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const registry = yield* SyncProviderRegistryService;
            const account = yield* seed.account({
                externalId: 'shared-card',
                externalSource: ExternalSourceEnum.MONOBANK,
                type: AccountTypeEnum.BANK_SYNC,
                instrumentId: 1
            });
            yield* seed.sync({ accountId: account.id, token: PREVIOUS_KEY, provider: ExternalSourceEnum.MONOBANK });
            const integration = yield* seed.bankIntegration({ provider: ExternalSourceEnum.MONOBANK, token: PREVIOUS_KEY });
            const requestedTokens = countClientInfoRequests({
                [PREVIOUS_KEY]: ['shared-card'],
                [NEXT_KEY]: ['shared-card', 'next-card']
            });

            yield* monobankSyncService.fetchAccountsPreview(PREVIOUS_KEY);
            yield* skipRequestedSync(registry.updateIntegrationToken(integration.id, NEXT_KEY));
            const previews = yield* monobankSyncService.fetchAccountsPreview(NEXT_KEY);

            expect(previews.map(preview => preview.externalId)).toEqual(['shared-card', 'next-card']);
            expect(requestedTokens).toEqual([PREVIOUS_KEY, NEXT_KEY]);
        }).pipe(Effect.provide(TestLayer))
    );
});
