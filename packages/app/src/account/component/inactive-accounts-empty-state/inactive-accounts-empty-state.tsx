import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';

import { AccountsEmptyStateBase } from '../accounts-empty-state-base/accounts-empty-state-base';

export const InactiveAccountsEmptyState = () => (
    <AccountsEmptyStateBase
        icon={UserIconNameEnum.EyeOff}
        title={<Trans>No inactive accounts</Trans>}
        description={<Trans>Accounts you mark as inactive will appear here. They won&apos;t be shown on the main page.</Trans>}
    />
);
