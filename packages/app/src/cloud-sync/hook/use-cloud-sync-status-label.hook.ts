import { useAtomValue } from '@effect/atom-react/Hooks';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import * as Schedule from 'effect/Schedule';
import * as Stream from 'effect/Stream';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum } from '../enum/cloud-sync-status.enum';

import type { MessageDescriptor } from '@lingui/core';

const cloudSyncStatusNowAtom = Atom.make(
    Stream.fromEffect(Clock.currentTimeMillis).pipe(Stream.repeat(Schedule.spaced(Duration.minutes(1))))
);

const CLOUD_SYNC_STATUS_MESSAGE: Record<Exclude<CloudSyncStatusEnum, CloudSyncStatusEnum.IDLE>, MessageDescriptor> = {
    [CloudSyncStatusEnum.SYNCING]: msg`Syncing…`,
    [CloudSyncStatusEnum.PAUSED_SIGNED_OUT]: msg`Paused: signed out of iCloud`,
    [CloudSyncStatusEnum.PAUSED_OTHER_ACCOUNT]: msg`Paused: a different Apple ID is signed in`,
    [CloudSyncStatusEnum.UPDATE_REQUIRED]: msg`Update Budgie to keep syncing`,
    [CloudSyncStatusEnum.LINEAGE_CONFLICT]: msg`Choose which data to keep`,
    [CloudSyncStatusEnum.ERROR]: msg`Sync error`
};

export const useCloudSyncStatusLabel = () => {
    const { t } = useLingui();
    const { formatRelativeToNow } = useFormatDate();
    const { status, lastSyncedAt } = useAtomValue(cloudSyncStatusAtom);
    const now = AsyncResult.getOrElse(useAtomValue(cloudSyncStatusNowAtom), Date.now);

    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(new Date(lastSyncedAt), now) : '';
    const idleLabel = isDefined(lastSyncedAt) ? t`Synced ${relative}` : t`Not synced yet`;

    return {
        label: status === CloudSyncStatusEnum.IDLE ? idleLabel : t(CLOUD_SYNC_STATUS_MESSAGE[status]),
        isHealthy: status === CloudSyncStatusEnum.IDLE || status === CloudSyncStatusEnum.SYNCING
    };
};
