import { AccountEntityInterface, SyncStatusEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useBankIntegration } from '../context/bank-integration.context';

import { useAccountSync } from './use-account-sync.hook';

export const useBankIntegrationAccountRowState = (account: Pick<AccountEntityInterface, 'id' | 'isActive'>) => {
    const { t } = useLingui();
    const { capabilities } = useBankIntegration();
    const { sync } = useAccountSync(account.id);

    const switchLabel = capabilities.supportsFileImport ? t`Include in file imports` : t`Sync`;

    let description = '';
    if (capabilities.supportsLiveSync && sync?.status === SyncStatusEnum.FAILED) {
        description = isNotEmptyString(sync.lastError) ? `${t`Sync Failed`}: ${sync.lastError}` : t`Sync Failed`;
    } else if (!account.isActive) {
        description = t`Hidden from Home`;
    } else if (isDefined(sync)) {
        if (capabilities.supportsFileImport) {
            description = sync.enabled ? t`Included in file imports` : t`Excluded from file imports`;
        } else if (capabilities.supportsLiveSync && !sync.enabled) {
            description = t`Sync paused`;
        }
    }

    const isToggleVisible = isDefined(sync) && (capabilities.supportsLiveSync || capabilities.supportsFileImport);

    return { sync, switchLabel, description, isToggleVisible };
};
