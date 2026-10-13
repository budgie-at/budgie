import { MonobankClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { HttpResponse, http } from 'msw';

import { buildMonobank, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const STATEMENT_ENDPOINT = 'https://api.monobank.ua/personal/statement/:account/:from/:to';

const SUCCESS_ON_ATTEMPT = 3;
const STATEMENT_WINDOW_SECONDS = 60;

describe('monobank/retry-policy', () => {
    it.effect('retries a 5xx statement response until it succeeds', () =>
        Effect.gen(function* () {
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

            const transactions = yield* new MonobankClient('test-token').getTransactions(
                'mono-card',
                Math.floor(Date.now() / 1000) - STATEMENT_WINDOW_SECONDS
            );

            expect(attempts).toBe(SUCCESS_ON_ATTEMPT);
            expect(transactions).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not retry a 429 statement response, so the rate limit budget is not spent', () =>
        Effect.gen(function* () {
            let attempts = 0;
            mockServer.use(
                http.get(STATEMENT_ENDPOINT, () => {
                    attempts += 1;

                    return new HttpResponse(null, { status: 429 });
                })
            );

            const exit = yield* Effect.exit(
                new MonobankClient('test-token').getTransactions('mono-card', Math.floor(Date.now() / 1000) - STATEMENT_WINDOW_SECONDS)
            );

            expect(Exit.isFailure(exit)).toBe(true);
            expect(attempts).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
