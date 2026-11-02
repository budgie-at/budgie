import { SyncEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { MetaPillVariant } from '../../../@generic/type/meta-pill-variant.type';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { BANK_INTEGRATION_SYNC_STATUS_ICON } from '../../constant/bank-integration-sync-status-icon.constant';
import { useBankIntegration } from '../../context/bank-integration.context';
import { BankIntegrationSyncStatusEnum } from '../../enum/bank-integration-sync-status.enum';
import { useFormatSyncTime } from '../../hook/use-format-sync-time.hook';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { getBankIntegrationSyncStatus } from '../../utils/get-bank-integration-sync-status.util';
import { getLatestForwardSyncedAt } from '../../utils/get-latest-forward-synced-at.util';

interface Props {
    readonly syncs: Array<Pick<SyncEntityInterface, 'enabled' | 'status' | 'mode' | 'forwardSyncedAt'>>;
}

const STATUS_VARIANT: Record<BankIntegrationSyncStatusEnum, MetaPillVariant> = {
    [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: 'destructive',
    [BankIntegrationSyncStatusEnum.KEY_REJECTED]: 'destructive',
    [BankIntegrationSyncStatusEnum.SYNCING]: 'warning',
    [BankIntegrationSyncStatusEnum.PAUSED]: 'default',
    [BankIntegrationSyncStatusEnum.UP_TO_DATE]: 'positive'
};

export const BankIntegrationStatusPill = ({ syncs }: Props) => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const formatSyncTime = useFormatSyncTime();

    const status = getBankIntegrationSyncStatus(syncs, isKeyRejected);
    const lastSyncedAt = getLatestForwardSyncedAt(syncs);
    const lastSyncedLabel = isDefined(lastSyncedAt) ? formatSyncTime(lastSyncedAt) : null;
    const upToDateLabel = isDefined(lastSyncedLabel) ? t`Up to date · ${lastSyncedLabel}` : t`Up to date`;
    const statusLabels: Record<BankIntegrationSyncStatusEnum, string> = {
        [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: t`Needs attention`,
        [BankIntegrationSyncStatusEnum.KEY_REJECTED]: t`Key rejected`,
        [BankIntegrationSyncStatusEnum.SYNCING]: t`Syncing…`,
        [BankIntegrationSyncStatusEnum.PAUSED]: t`Paused`,
        [BankIntegrationSyncStatusEnum.UP_TO_DATE]: upToDateLabel
    };

    return (
        <MetaPill
            label={statusLabels[status]}
            icon={BANK_INTEGRATION_SYNC_STATUS_ICON[status]}
            variant={STATUS_VARIANT[status]}
            testID={BankIntegrationSelector.StatusPill}
        />
    );
};
