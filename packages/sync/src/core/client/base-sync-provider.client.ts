import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientRequest from 'effect/http/HttpClientRequest';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Option from 'effect/Option';
import * as Schedule from 'effect/Schedule';
import * as Schema from 'effect/Schema';

import { isDefined } from '@rnw-community/shared';

import { SYNC_RETRY_STATUS_CODES } from '../constant/sync-retry-status-codes.constant';
import { SyncInvalidResponseError } from '../error/sync-invalid-response.error';
import { SyncNetworkError } from '../error/sync-network.error';
import { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import { SyncUnauthorizedError } from '../error/sync-unauthorized.error';

import type { SyncProviderEnum } from '../enum/sync-provider.enum';
import type * as Headers from 'effect/http/Headers';
import type * as HttpClientError from 'effect/http/HttpClientError';
import type { HttpMethod } from 'effect/http/HttpMethod';

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export abstract class BaseSyncProviderClient {
    private static readonly RETRY_LIMIT = 3;
    private static readonly RETRY_BASE_DELAY = '300 millis';
    private static readonly TIMEOUT = '30 seconds';

    private static readonly ApiErrorSchema = Schema.Struct({
        code: Schema.optional(Schema.Union([Schema.String, Schema.Number])),
        message: Schema.optional(Schema.String),
        msg: Schema.optional(Schema.String)
    });

    protected readonly retryStatusCodes: readonly number[] = SYNC_RETRY_STATUS_CODES;
    protected readonly retryMethods: readonly HttpMethod[] = ['GET'];

    private readonly execute = Effect.fn('BaseSyncProviderClient.execute')(
        function* (this: BaseSyncProviderClient, endpoint: string, method: HttpMethod) {
            const client = (yield* HttpClient.HttpClient).pipe(
                HttpClient.tap(response =>
                    Effect.sync(() => {
                        this.onResponseHeaders(response.headers);
                    })
                ),
                HttpClient.filterStatusOk,
                HttpClient.retry({
                    times: this.retryMethods.includes(method) ? BaseSyncProviderClient.RETRY_LIMIT : 0,
                    schedule: Schedule.exponential(BaseSyncProviderClient.RETRY_BASE_DELAY),
                    while: error => !isDefined(error.response) || this.retryStatusCodes.includes(error.response.status)
                })
            );

            return yield* client.execute(HttpClientRequest.make(method)(`${this.baseUrl}${endpoint}`, { headers: this.headers }));
        },
        Effect.timeout(BaseSyncProviderClient.TIMEOUT),
        effect => effect.pipe(Effect.catch(error => this.toSyncError(error)))
    );

    private readonly toSyncError = Effect.fn('BaseSyncProviderClient.toSyncError')(function* (
        this: BaseSyncProviderClient,
        error: HttpClientError.HttpClientError | Cause.TimeoutError
    ) {
        const { provider } = this;

        if (Cause.isTimeoutError(error) || !isDefined(error.response)) {
            return yield* new SyncNetworkError({ provider, message: 'Network error' });
        }

        const { response } = error;
        const apiError = Option.getOrUndefined(
            yield* HttpClientResponse.schemaBodyJson(BaseSyncProviderClient.ApiErrorSchema)(response).pipe(Effect.option)
        );
        const message = apiError?.msg ?? apiError?.message ?? `HTTP ${response.status}`;

        switch (response.status) {
            case HTTP_STATUS_UNAUTHORIZED:
            case HTTP_STATUS_FORBIDDEN:
                return yield* new SyncUnauthorizedError({ provider, message });
            case HTTP_STATUS_TOO_MANY_REQUESTS:
                return yield* new SyncRateLimitedError({ provider, message });
            case HTTP_STATUS_BAD_REQUEST:
                return yield* new SyncInvalidResponseError({ provider, message, apiCode: apiError?.code });
            default:
                return yield* new SyncNetworkError({ provider, message });
        }
    });

    protected abstract readonly provider: SyncProviderEnum;
    protected abstract readonly baseUrl: string;
    protected abstract readonly headers: Record<string, string>;

    protected fetchJson<S extends Schema.ConstraintDecoder<unknown>>(schema: S, endpoint: string, method: HttpMethod = 'GET') {
        return this.execute(endpoint, method).pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
            Effect.catchTag('SchemaError', error =>
                Effect.fail(new SyncInvalidResponseError({ provider: this.provider, message: error.message }))
            ),
            Effect.catchTag('HttpClientError', () =>
                Effect.fail(new SyncNetworkError({ provider: this.provider, message: 'Network error' }))
            )
        );
    }

    protected onResponseHeaders(_headers: Headers.Headers): void {
        return void 0;
    }
}
