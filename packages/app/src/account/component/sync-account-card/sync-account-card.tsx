import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const SyncAccountCard = ({ account, balance }: Props) => {
    const { sync } = account;

    const quickImportConfig = isDefined(sync) ? (quickImportConfigMap[sync.provider] ?? null) : null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);

    return <AccountCardBase account={account} balance={balance} {...(isDefined(quickImportConfig) && { onImport: handleQuickImport })} />;
};
