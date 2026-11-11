import { CloudSyncErrorReasonEnum, CloudSyncStatusEnum } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { minuteClockAtom } from '../../@generic/constant/minute-clock-atom.constant';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';

import type { MessageDescriptor } from '@lingui/core';

const CLOUD_SYNC_ERROR_MESSAGE: Record<CloudSyncErrorReasonEnum, MessageDescriptor> = {
    [CloudSyncErrorReasonEnum.NETWORK_UNAVAILABLE]: msg`Sync paused: no internet connection. Check your connection, then try again.`,
    [CloudSyncErrorReasonEnum.ICLOUD_BUSY]: msg`Sync paused: iCloud is busy right now. Try again in a few minutes.`,
    [CloudSyncErrorReasonEnum.ACCOUNT_NEEDS_ATTENTION]: msg`Sync paused: your Apple Account needs attention. Check iCloud in the Settings app, then try again.`,
    [CloudSyncErrorReasonEnum.CHANGES_REJECTED]: msg`Some changes could not be uploaded to iCloud. Your data is safe on this device. Try again.`,
    [CloudSyncErrorReasonEnum.UNKNOWN]: msg`Sync paused by an iCloud error. Your data is safe on this device. Try again.`
};

const CLOUD_SYNC_STATUS_MESSAGE: Record<
    Exclude<CloudSyncStatusEnum, CloudSyncStatusEnum.IDLE | CloudSyncStatusEnum.ERROR>,
    MessageDescriptor
> = {
    [CloudSyncStatusEnum.SYNCING]: msg`Syncing…`,
    [CloudSyncStatusEnum.PAUSED_SIGNED_OUT]: msg`Sign in to iCloud to turn on`,
    [CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT]: msg`Paused: a different Apple Account is signed in`,
    [CloudSyncStatusEnum.UPDATE_REQUIRED]: msg`Update Budgie to keep syncing`,
    [CloudSyncStatusEnum.LINEAGE_CONFLICT]: msg`Choose which data to keep`
};

export const useCloudSyncStatusLabel = () => {
    const { t } = useLingui();
    const { formatRelativeToNow } = useFormatDate();
    const { status, lastSyncedAt, isQuotaExceeded, errorReason } = useAtomValue(cloudSyncStatusAtom);
    const now = AsyncResult.getOrElse(useAtomValue(minuteClockAtom), Date.now);

    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(new Date(lastSyncedAt), now) : '';
    const idleLabel = isDefined(lastSyncedAt) ? t`Synced ${relative}` : t`Not synced yet`;

    const isFailed = status === CloudSyncStatusEnum.ERROR;
    const messages = {
        ...CLOUD_SYNC_STATUS_MESSAGE,
        [CloudSyncStatusEnum.ERROR]: CLOUD_SYNC_ERROR_MESSAGE[errorReason ?? CloudSyncErrorReasonEnum.UNKNOWN]
    };
    const statusLabel = status === CloudSyncStatusEnum.IDLE ? idleLabel : t(messages[status]);
    const isActive = status === CloudSyncStatusEnum.IDLE || status === CloudSyncStatusEnum.SYNCING;
    const isQuotaBlocking = isQuotaExceeded && isActive;

    return {
        label: isQuotaBlocking ? t`iCloud storage full` : statusLabel,
        isHealthy: isActive && !isQuotaExceeded,
        isSignedOut: status === CloudSyncStatusEnum.PAUSED_SIGNED_OUT,
        isFailed
    };
};
