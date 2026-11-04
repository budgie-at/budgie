import { UserIconNameEnum } from '@budgie/contracts';

import { BankIntegrationSyncStatusEnum } from '../enum/bank-integration-sync-status.enum';

export const BANK_INTEGRATION_SYNC_STATUS_ICON: Record<BankIntegrationSyncStatusEnum, UserIconNameEnum> = {
    [BankIntegrationSyncStatusEnum.NEEDS_ATTENTION]: UserIconNameEnum.CircleAlert,
    [BankIntegrationSyncStatusEnum.KEY_REJECTED]: UserIconNameEnum.KeyRound,
    [BankIntegrationSyncStatusEnum.SYNCING]: UserIconNameEnum.RefreshCw,
    [BankIntegrationSyncStatusEnum.PAUSED]: UserIconNameEnum.CirclePause,
    [BankIntegrationSyncStatusEnum.UP_TO_DATE]: UserIconNameEnum.CircleCheck
};
