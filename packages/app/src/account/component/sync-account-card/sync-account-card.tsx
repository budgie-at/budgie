import { AccountWithSyncEntityInterface } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const SyncAccountCard = ({ account, balance }: Props) => {
    const { sync } = account;

    const [, hapticImpact] = useVibration();

    const quickImportConfig = isDefined(sync) ? (quickImportConfigMap[sync.provider] ?? null) : null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        handleQuickImport();
    };

    const longPressHandler = isDefined(quickImportConfig) ? handleLongPress : emptyFn;

    return <AccountCardBase account={account} balance={balance} onLongPress={longPressHandler} />;
};
