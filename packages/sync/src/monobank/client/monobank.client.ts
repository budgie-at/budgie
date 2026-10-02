import { MonobankApiError, MonobankPersonalClient, MonobankResponseValidationError } from '@liaugust/monobank-sdk';
import { getUnixTime } from 'date-fns/getUnixTime';
import * as Effect from 'effect/Effect';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_TOO_MANY_REQUESTS, HTTP_STATUS_UNAUTHORIZED } from '../../core/constant/http-status.constant';
import { SYNC_RETRY_STATUS_CODES } from '../../core/constant/sync-retry-status-codes.constant';
import { SYNC_TIMEOUT_MS } from '../../core/constant/sync-timeout-ms.constant';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncInvalidResponseError } from '../../core/error/sync-invalid-response.error';
import { SyncNetworkError } from '../../core/error/sync-network.error';
import { SyncRateLimitedError } from '../../core/error/sync-rate-limited.error';
import { SyncUnauthorizedError } from '../../core/error/sync-unauthorized.error';
import { monobankAccountMapper } from '../mapper/monobank-account.mapper';
import { monobankJarMapper } from '../mapper/monobank-jar.mapper';
import { monobankTransactionMapper } from '../mapper/monobank-transaction.mapper';

import type { SyncError } from '../../core/interface/sync-error.type';
import type { SyncProviderClientInterface } from '../../core/interface/sync-provider-client.interface';
import type { ClientInfo } from '@liaugust/monobank-sdk';

export class MonobankClient implements SyncProviderClientInterface {
    private static readonly RETRY_BASE_DELAY_MS = 300;
    private static readonly RETRY_MAX_ATTEMPTS = 4;
    private static readonly RETRY_MAX_DELAY_MS = 2_000;

    readonly getAccounts = Effect.fn('MonobankClient.getAccounts')(function* (this: MonobankClient) {
        return (yield* this.fetchClientInfo()).accounts.map(monobankAccountMapper);
    });

    readonly getJars = Effect.fn('MonobankClient.getJars')(function* (this: MonobankClient) {
        return ((yield* this.fetchClientInfo()).jars ?? []).map(monobankJarMapper);
    });

    readonly getTransactions = Effect.fn('MonobankClient.getTransactions')(function* (
        this: MonobankClient,
        accountId: string,
        from: number,
        to?: number
    ) {
        const statements = yield* this.request(() =>
            this.personalClient.statements.get({ account: accountId, from, to: to ?? getUnixTime(new Date()) })
        );

        return statements.map(statement => monobankTransactionMapper(statement, accountId));
    });

    private readonly personalClient: MonobankPersonalClient;
    private cachedClientInfo: ClientInfo | undefined;

    private readonly fetchClientInfo = Effect.fn('MonobankClient.fetchClientInfo')(function* (this: MonobankClient) {
        if (!isDefined(this.cachedClientInfo)) {
            this.cachedClientInfo = yield* this.request(() => this.personalClient.client.getInfo());
        }

        return this.cachedClientInfo;
    });

    constructor(token: string) {
        this.personalClient = new MonobankPersonalClient({
            retry: {
                baseDelayMs: MonobankClient.RETRY_BASE_DELAY_MS,
                maxAttempts: MonobankClient.RETRY_MAX_ATTEMPTS,
                maxDelayMs: MonobankClient.RETRY_MAX_DELAY_MS,
                retryableStatusCodes: SYNC_RETRY_STATUS_CODES
            },
            timeoutMs: SYNC_TIMEOUT_MS,
            token
        });
    }

    private request<A>(run: () => Promise<A>): Effect.Effect<A, SyncError> {
        return Effect.tryPromise({ try: run, catch: error => this.toSyncError(error) });
    }

    private toSyncError(error: unknown): SyncError {
        const provider = SyncProviderEnum.MONOBANK;
        const message = getErrorMessage(error);

        if (error instanceof MonobankResponseValidationError) {
            return new SyncInvalidResponseError({ provider, message });
        }

        if (!(error instanceof MonobankApiError)) {
            return new SyncNetworkError({ provider, message });
        }

        switch (error.status) {
            case HTTP_STATUS_UNAUTHORIZED:
                return new SyncUnauthorizedError({ provider, message });
            case HTTP_STATUS_TOO_MANY_REQUESTS:
                return new SyncRateLimitedError({ provider, message });
            case HTTP_STATUS_BAD_REQUEST:
                return new SyncInvalidResponseError({ provider, message });
            default:
                return new SyncNetworkError({ provider, message: `HTTP ${String(error.status)}: ${message}` });
        }
    }
}
