import { SyncErrorCodeEnum } from '@budgie/contracts';
import * as Schema from 'effect/Schema';

import { BinanceKeyPermissionsError } from '../../binance/error/binance-key-permissions.error';
import { EnableBankingErrorCodeEnum } from '../../enable-banking/enum/enable-banking-error-code.enum';
import { SyncConsentExpiredError } from '../error/sync-consent-expired.error';
import { SyncInvalidResponseError } from '../error/sync-invalid-response.error';
import { SyncNetworkError } from '../error/sync-network.error';
import { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import { SyncRegionUnavailableError } from '../error/sync-region-unavailable.error';
import { SyncUnauthorizedError } from '../error/sync-unauthorized.error';

const TIMESTAMP_OUTSIDE_WINDOW_API_CODE = -1021;

export const resolveSyncErrorCode = (error: unknown): SyncErrorCodeEnum | null => {
    if (Schema.is(SyncUnauthorizedError)(error)) {
        return SyncErrorCodeEnum.UNAUTHORIZED;
    }

    if (Schema.is(SyncConsentExpiredError)(error)) {
        return SyncErrorCodeEnum.CONSENT_EXPIRED;
    }

    if (Schema.is(SyncInvalidResponseError)(error) && error.apiCode === EnableBankingErrorCodeEnum.ACCOUNT_NOT_LINKED) {
        return SyncErrorCodeEnum.ACCOUNT_NOT_LINKED;
    }

    if (Schema.is(BinanceKeyPermissionsError)(error)) {
        return SyncErrorCodeEnum.KEY_PERMISSIONS;
    }

    if (Schema.is(SyncRateLimitedError)(error)) {
        return SyncErrorCodeEnum.RATE_LIMITED;
    }

    if (Schema.is(SyncRegionUnavailableError)(error)) {
        return SyncErrorCodeEnum.REGION_UNAVAILABLE;
    }

    if (Schema.is(SyncNetworkError)(error)) {
        return SyncErrorCodeEnum.NETWORK;
    }

    if (Schema.is(SyncInvalidResponseError)(error) && Number(error.apiCode) === TIMESTAMP_OUTSIDE_WINDOW_API_CODE) {
        return SyncErrorCodeEnum.CLOCK_SKEW;
    }

    return null;
};
