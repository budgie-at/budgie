import { ExternalSourceEnum, SyncEntityInterface, SyncStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Clock from 'effect/Clock';
import * as Duration from 'effect/Duration';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import * as Schedule from 'effect/Schedule';
import * as Stream from 'effect/Stream';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BANK_INTEGRATION_SYNC_STATUS_ICON } from '../../constant/bank-integration-sync-status-icon.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../../enum/bank-integration-sync-status.enum';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { getBankIntegrationSyncStatus } from '../../utils/get-bank-integration-sync-status.util';
import { getLatestForwardSyncedAt } from '../../utils/get-latest-forward-synced-at.util';
import { isBankIntegrationSyncStale } from '../../utils/is-bank-integration-sync-stale.util';
import { BankIntegrationImportStatus } from '../bank-integration-import-status/bank-integration-import-status';

const bankIntegrationStatusNowAtom = Atom.make(
    Clock.currentTimeMillis.pipe(Stream.fromEffect, Stream.repeat(Schedule.spaced(Duration.minutes(1))))
);

interface Props {
    readonly syncs: Array<Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt'>>;
}

export const BankIntegrationStatusLine = ({ syncs }: Props) => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const { formatRelativeToNow } = useFormatDate();
    const now = AsyncResult.getOrElse(useAtomValue(bankIntegrationStatusNowAtom), Date.now);
    const status = getBankIntegrationSyncStatus(syncs, isKeyRejected);
    const isStale = status === BankIntegrationSyncStatusEnum.UP_TO_DATE && isBankIntegrationSyncStale(syncs, now);
    const lastSyncedAt = getLatestForwardSyncedAt(syncs.filter(sync => !capabilities.supportsLiveSync || sync.enabled));
    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(lastSyncedAt, now) : '';
    const statusLabels: Record<BankIntegrationSyncStatusEnum, string> = {
        [BankIntegrationSyncStatusEnum.KEY_REJECTED]: t`Key rejected — sync is paused`,
        [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: t({
            message: plural(syncs.filter(sync => sync.status === SyncStatusEnum.FAILED).length, {
                one: 'Sync failed for # account',
                other: 'Sync failed for # accounts'
            })
        }),
        [BankIntegrationSyncStatusEnum.SYNCING]: t`Syncing…`,
        [BankIntegrationSyncStatusEnum.PAUSED]:
            integration.provider === ExternalSourceEnum.BINANCE ? t`Sync is off for all assets` : t`Sync is off for all accounts`,
        [BankIntegrationSyncStatusEnum.UP_TO_DATE]: isDefined(lastSyncedAt) ? t`Synced ${relative}` : t`Not synced yet`
    };
    const label = isStale ? t`Last synced ${relative}` : statusLabels[status];
    const appearance = {
        className:
            capabilities.supportsLiveSync &&
            (status === BankIntegrationSyncStatusEnum.KEY_REJECTED || status === BankIntegrationSyncStatusEnum.NEEDS_ATTENTION)
                ? 'text-destructive-strong'
                : 'text-secondary-foreground',
        icon: isStale ? UserIconNameEnum.Clock : BANK_INTEGRATION_SYNC_STATUS_ICON[status]
    };

    if (capabilities.supportsFileImport) {
        return <BankIntegrationImportStatus lastSyncedAt={lastSyncedAt} />;
    }

    return (
        <View className="flex-row flex-wrap items-center justify-center gap-x-sm gap-y-xxs" testID={BankIntegrationSelector.StatusPill}>
            <Icon icon={appearance.icon} size={15} className={appearance.className} />
            <Text className={cn(appearance.className, 'text-[15px] text-center shrink')}>{label}</Text>
        </View>
    );
};
