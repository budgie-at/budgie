import { MonobankSyncService } from '@budgie/sync';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildMonobank } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

const SUCCESS_ON_ATTEMPT = 3;

describe('monobank/retry-policy', () => {
    it('retries a 5xx statement response until it succeeds', async () => {
        let attempts = 0;
        mockServer.use(
            http.get(STATEMENT_ENDPOINT, () => {
                attempts += 1;

                if (attempts < SUCCESS_ON_ATTEMPT) {
                    return new HttpResponse(null, { status: 503 });
                }

                return HttpResponse.json([buildMonobank.transaction({ id: 'tx-1', amount: -100, hold: false })]);
            })
        );

        const result = await new MonobankSyncService('test-token').syncTransactionsForward('mono-card', new Date());

        expect(attempts).toBe(SUCCESS_ON_ATTEMPT);
        expect(result.transactions).toHaveLength(1);
    });

    it('does not retry a 429 statement response, so the rate limit budget is not spent', async () => {
        let attempts = 0;
        mockServer.use(
            http.get(STATEMENT_ENDPOINT, () => {
                attempts += 1;

                return new HttpResponse(null, { status: 429 });
            })
        );

        await expect(new MonobankSyncService('test-token').syncTransactionsForward('mono-card', new Date())).rejects.toThrow();
        expect(attempts).toBe(1);
    });
});
