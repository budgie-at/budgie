import { SyncErrorCodeEnum } from '@budgie/contracts';

import { BinanceKeyPermissionsError } from '../../binance/error/binance-key-permissions.error';
import { SyncInvalidResponseError } from '../error/sync-invalid-response.error';
import { SyncNetworkError } from '../error/sync-network.error';
import { SyncRateLimitedError } from '../error/sync-rate-limited.error';
import { SyncRegionUnavailableError } from '../error/sync-region-unavailable.error';
import { SyncUnauthorizedError } from '../error/sync-unauthorized.error';

const TIMESTAMP_OUTSIDE_WINDOW_API_CODE = -1021;

export const resolveSyncErrorCode = (error: unknown): SyncErrorCodeEnum | null => {
    if (error instanceof SyncUnauthorizedError) {
        return SyncErrorCodeEnum.UNAUTHORIZED;
    }

    if (error instanceof BinanceKeyPermissionsError) {
        return SyncErrorCodeEnum.KEY_PERMISSIONS;
    }

    if (error instanceof SyncRateLimitedError) {
        return SyncErrorCodeEnum.RATE_LIMITED;
    }

    if (error instanceof SyncRegionUnavailableError) {
        return SyncErrorCodeEnum.REGION_UNAVAILABLE;
    }

    if (error instanceof SyncNetworkError) {
        return SyncErrorCodeEnum.NETWORK;
    }

    if (error instanceof SyncInvalidResponseError && Number(error.apiCode) === TIMESTAMP_OUTSIDE_WINDOW_API_CODE) {
        return SyncErrorCodeEnum.CLOCK_SKEW;
    }

    return null;
};
