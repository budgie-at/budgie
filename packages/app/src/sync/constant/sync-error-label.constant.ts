import { SyncErrorCodeEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const SYNC_ERROR_LABEL: Record<SyncErrorCodeEnum, MessageDescriptor> = {
    [SyncErrorCodeEnum.UNAUTHORIZED]: msg`The API key or token was rejected. Check that it is correct, read-only and not restricted to other IP addresses.`,
    [SyncErrorCodeEnum.KEY_PERMISSIONS]: msg`The API key has the wrong permissions. Use a key with only "Enable Reading".`,
    [SyncErrorCodeEnum.RATE_LIMITED]: msg`The service is limiting requests. Sync will retry automatically in a few minutes.`,
    [SyncErrorCodeEnum.REGION_UNAVAILABLE]: msg`Binance is not available in your region, so this account cannot sync.`,
    [SyncErrorCodeEnum.CLOCK_SKEW]: msg`Your device clock is out of sync. Enable automatic date and time, then try again.`,
    [SyncErrorCodeEnum.NETWORK]: msg`Could not reach the server. Check your connection; sync will retry automatically.`
};
