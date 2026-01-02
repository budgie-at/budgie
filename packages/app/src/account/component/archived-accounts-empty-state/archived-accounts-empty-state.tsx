import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';

import { AccountsEmptyStateBase } from '../accounts-empty-state-base/accounts-empty-state-base';

export const ArchivedAccountsEmptyState = () => (
    <AccountsEmptyStateBase
        icon={UserIconNameEnum.Archive}
        title={<Trans>No archived accounts</Trans>}
        description={<Trans>Accounts you archive will appear here. They won&apos;t be included in your totals or main view.</Trans>}
    />
);
