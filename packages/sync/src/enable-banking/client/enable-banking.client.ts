import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { BaseSyncProviderClient } from '../../core/client/base-sync-provider.client';
import { HTTP_STATUS_FORBIDDEN, HTTP_STATUS_TOO_MANY_REQUESTS, HTTP_STATUS_UNAUTHORIZED } from '../../core/constant/http-status.constant';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncConsentExpiredError } from '../../core/error/sync-consent-expired.error';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncNetworkError } from '../../core/error/sync-network.error';
import { SyncRateLimitedError } from '../../core/error/sync-rate-limited.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { EnableBankingErrorCodeEnum } from '../enum/enable-banking-error-code.enum';
import { EnableBankingApplicationApiSchema } from '../interface/enable-banking-application-api.schema';
import { EnableBankingAspspListApiSchema } from '../interface/enable-banking-aspsp-api.schema';
import { EnableBankingBalanceListApiSchema } from '../interface/enable-banking-balance-api.schema';
import {
    EnableBankingAuthorizedSessionApiSchema,
    EnableBankingSessionApiSchema,
    EnableBankingStartAuthorizationApiSchema
} from '../interface/enable-banking-session-api.schema';
import { EnableBankingTransactionPageApiSchema } from '../interface/enable-banking-transaction-api.schema';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { EnableBankingTransactionApiInterface } from '../interface/enable-banking-transaction-api.schema';
import type { EnableBankingTransactionQueryInterface } from '../interface/enable-banking-transaction-query.interface';
import type * as Headers from 'effect/http/Headers';
import type { HttpMethod } from 'effect/http/HttpMethod';

export class EnableBankingClient extends BaseSyncProviderClient {
    private static readonly CONSENT_ERROR_CODES: ReadonlySet<string | number | undefined> = new Set([
        EnableBankingErrorCodeEnum.CLOSED_SESSION,
        EnableBankingErrorCodeEnum.EXPIRED_SESSION,
        EnableBankingErrorCodeEnum.REVOKED_SESSION,
        EnableBankingErrorCodeEnum.SESSION_DOES_NOT_EXIST,
        EnableBankingErrorCodeEnum.WRONG_SESSION_STATUS
    ]);

    private static readonly DEFAULT_RETRY_AFTER_MS = 5 * 60 * 1000;
    private static readonly MILLISECONDS_PER_SECOND = 1000;
    private static readonly SERVER_ERROR_STATUS = 500;

    protected override readonly provider = SyncProviderEnum.ENABLE_BANKING;
    protected override readonly baseUrl = 'https://api.enablebanking.com';
    protected override readonly headers: Record<string, string>;
    protected override readonly retryMethods: readonly HttpMethod[] = [];

    constructor(jwt: string) {
        super();
        this.headers = { Authorization: `Bearer ${jwt}` };
    }

    getApplication() {
        return this.fetchSanitized(EnableBankingApplicationApiSchema, '/application');
    }

    getAspsps(country: string | null) {
        return this.fetchSanitized(
            EnableBankingAspspListApiSchema,
            `/aspsps?psu_type=personal${isDefined(country) ? `&country=${encodeURIComponent(country)}` : ''}`
        );
    }

    startAuthorization(body: unknown) {
        return this.fetchSanitized(EnableBankingStartAuthorizationApiSchema, '/auth', 'POST', body);
    }

    authorizeSession(code: string) {
        return this.fetchSanitized(EnableBankingAuthorizedSessionApiSchema, '/sessions', 'POST', { code });
    }

    getSession(sessionId: string) {
        return this.fetchSanitized(EnableBankingSessionApiSchema, `/sessions/${encodeURIComponent(sessionId)}`);
    }

    deleteSession(sessionId: string) {
        return this.fetchSanitized(Schema.Unknown, `/sessions/${encodeURIComponent(sessionId)}`, 'DELETE');
    }

    getBalances(accountUid: string) {
        return this.fetchSanitized(EnableBankingBalanceListApiSchema, `/accounts/${encodeURIComponent(accountUid)}/balances`);
    }

    getBookedTransactions(accountUid: string, query: EnableBankingTransactionQueryInterface) {
        const { provider } = this;

        return Effect.gen({ self: this }, function* () {
            const transactions: EnableBankingTransactionApiInterface[] = [];
            let continuationKey: string | null = null;

            do {
                const parameters: string[] = [
                    'transaction_status=BOOK',
                    ...(query.isLongest ? ['strategy=longest'] : []),
                    ...(isDefined(query.dateFrom) ? [`date_from=${query.dateFrom}`] : []),
                    ...(isDefined(continuationKey) ? [`continuation_key=${encodeURIComponent(continuationKey)}`] : [])
                ];
                const page: typeof EnableBankingTransactionPageApiSchema.Type = yield* this.fetchSanitized(
                    EnableBankingTransactionPageApiSchema,
                    `/accounts/${encodeURIComponent(accountUid)}/transactions?${parameters.join('&')}`
                );
                transactions.push(...page.transactions);

                if (isNotEmptyString(page.continuation_key) && page.continuation_key === continuationKey) {
                    return yield* new SyncInvalidResponseError({ provider, message: 'Enable Banking repeated a transactions page' });
                }
                continuationKey = isNotEmptyString(page.continuation_key) ? page.continuation_key : null;
            } while (isDefined(continuationKey));

            return transactions;
        });
    }

    protected override classifyApiError(
        status: number,
        _message: string,
        apiCode: string | number | undefined,
        headers: Headers.Headers
    ): SyncError {
        const { provider } = this;

        if (EnableBankingClient.CONSENT_ERROR_CODES.has(apiCode)) {
            return new SyncConsentExpiredError({ provider, message: 'The bank consent has expired or was revoked' });
        }

        if (apiCode === EnableBankingErrorCodeEnum.ASPSP_RATE_LIMIT_EXCEEDED) {
            return new SyncInvalidResponseError({ provider, message: 'The bank fetch allowance is used up', apiCode });
        }

        return this.classifyStatus(status, apiCode, headers);
    }

    private classifyStatus(status: number, apiCode: string | number | undefined, headers: Headers.Headers): SyncError {
        const { provider } = this;

        if (status === HTTP_STATUS_TOO_MANY_REQUESTS) {
            const retryAfterSeconds = Number(headers['retry-after']);

            return new SyncRateLimitedError({
                provider,
                message: 'Enable Banking is limiting requests',
                retryAfterMs: isPositiveNumber(retryAfterSeconds)
                    ? retryAfterSeconds * EnableBankingClient.MILLISECONDS_PER_SECOND
                    : EnableBankingClient.DEFAULT_RETRY_AFTER_MS
            });
        }

        if (status === HTTP_STATUS_UNAUTHORIZED || status === HTTP_STATUS_FORBIDDEN) {
            return new SyncUnauthorizedError({ provider, message: 'Enable Banking rejected the application key' });
        }

        if (status >= EnableBankingClient.SERVER_ERROR_STATUS) {
            return new SyncNetworkError({ provider, message: 'Enable Banking is unavailable' });
        }

        return new SyncInvalidResponseError({ provider, message: 'Enable Banking rejected the request', apiCode });
    }

    private fetchSanitized<S extends Schema.ConstraintDecoder<unknown>>(
        schema: S,
        endpoint: string,
        method: HttpMethod = 'GET',
        body: unknown = null
    ) {
        const { provider } = this;

        return this.fetchJson(schema, endpoint, method, body).pipe(
            Effect.mapError(error =>
                error instanceof SyncInvalidResponseError && !isDefined(error.apiCode)
                    ? new SyncInvalidResponseError({ provider, message: 'Enable Banking returned an unexpected response' })
                    : error
            )
        );
    }
}
