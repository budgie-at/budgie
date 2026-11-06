import { useAtomValue } from '@effect/atom-react/Hooks';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { minuteClockAtom } from '../../@generic/constant/minute-clock-atom.constant';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

import type { MessageDescriptor } from '@lingui/core';

const CLOUD_SYNC_STATUS_MESSAGE: Record<Exclude<CloudSyncStatusEnum, CloudSyncStatusEnum.IDLE>, MessageDescriptor> = {
    [CloudSyncStatusEnum.SYNCING]: msg`Syncing…`,
    [CloudSyncStatusEnum.PAUSED_SIGNED_OUT]: msg`Sign in to iCloud to turn on`,
    [CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT]: msg`Paused: a different Apple Account is signed in`,
    [CloudSyncStatusEnum.UPDATE_REQUIRED]: msg`Update Budgie to keep syncing`,
    [CloudSyncStatusEnum.LINEAGE_CONFLICT]: msg`Choose which data to keep`,
    [CloudSyncStatusEnum.ERROR]: msg`Couldn't sync. Budgie will try again.`
};

export const useCloudSyncStatusLabel = () => {
    const { t } = useLingui();
    const { formatRelativeToNow } = useFormatDate();
    const { status, lastSyncedAt, isQuotaExceeded } = useAtomValue(cloudSyncStatusAtom);
    const now = AsyncResult.getOrElse(useAtomValue(minuteClockAtom), Date.now);

    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(new Date(lastSyncedAt), now) : '';
    const idleLabel = isDefined(lastSyncedAt) ? t`Synced ${relative}` : t`Not synced yet`;

    const statusLabel = status === CloudSyncStatusEnum.IDLE ? idleLabel : t(CLOUD_SYNC_STATUS_MESSAGE[status]);
    const isActive = status === CloudSyncStatusEnum.IDLE || status === CloudSyncStatusEnum.SYNCING;
    const isQuotaBlocking = isQuotaExceeded && isActive;

    return {
        label: isQuotaBlocking ? t`iCloud storage full` : statusLabel,
        isHealthy: isActive && !isQuotaExceeded,
        isSignedOut: status === CloudSyncStatusEnum.PAUSED_SIGNED_OUT
    };
};
