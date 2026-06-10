import { AccountWithSyncEntityInterface, SyncEntityInterface } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { SyncStatusDot } from '../sync-status-dot/sync-status-dot';

interface Props extends Pick<AccountWithSyncEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly sync: SyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const SyncAccountCard = (props: Props) => {
    const { id, title, icon, balance, className, instrumentSymbol, sync } = props;

    const [, hapticImpact] = useVibration();

    const quickImportConfig = isDefined(sync) ? (quickImportConfigMap[sync.provider] ?? null) : null;
    const { handleQuickImport } = useQuickImport(quickImportConfig);

    const handleLongPress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        handleQuickImport();
    };

    const longPressHandler = isDefined(quickImportConfig) ? handleLongPress : emptyFn;

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            balance={balance}
            instrumentSymbol={instrumentSymbol}
            className={className}
            onLongPress={longPressHandler}
        >
            <SyncStatusDot sync={sync} />
        </AccountCardBase>
    );
};
