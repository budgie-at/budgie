import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Schedule from 'effect/Schedule';

import type * as Schema from 'effect/Schema';

export const fetchJson = Effect.fn('fetchJson')(function* <S extends Schema.ConstraintDecoder<unknown>>(
    url: string,
    schema: S,
    timeoutMs: number,
    urlParams: Record<string, string | number> = {}
) {
    const client = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
        HttpClient.transformResponse(Effect.timeout(timeoutMs)),
        HttpClient.retryTransient({ retryOn: 'errors-only', times: 1, schedule: Schedule.exponential(300) })
    );
    const response = yield* client.get(url, { urlParams });

    return yield* HttpClientResponse.schemaBodyJson(schema)(response);
});
