import { SyncErrorCodeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

export const useSyncErrorLabels = (): Record<SyncErrorCodeEnum, string> => {
    const { t } = useLingui();

    return {
        [SyncErrorCodeEnum.UNAUTHORIZED]: t`The API key or token was rejected. Check that it is correct, read-only and not restricted to other IP addresses.`,
        [SyncErrorCodeEnum.KEY_PERMISSIONS]: t`The API key has the wrong permissions. Use a key with only "Enable Reading".`,
        [SyncErrorCodeEnum.RATE_LIMITED]: t`The service is limiting requests. Sync will retry automatically in a few minutes.`,
        [SyncErrorCodeEnum.REGION_UNAVAILABLE]: t`Binance is not available in your region, so this account cannot sync.`,
        [SyncErrorCodeEnum.CLOCK_SKEW]: t`Your device clock is out of sync. Enable automatic date and time, then try again.`,
        [SyncErrorCodeEnum.NETWORK]: t`Could not reach the server. Check your connection; sync will retry automatically.`
    };
};
