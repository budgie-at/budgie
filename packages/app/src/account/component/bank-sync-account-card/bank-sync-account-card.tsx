import { AccountWithBankSyncEntityInterface, BankSyncEntityInterface } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { quickImportConfigMap } from '../../../sync/constant/quick-import-config-map.constant';
import { useQuickImport } from '../../../sync/hook/use-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { BankSyncStatusDot } from '../bank-sync-status-dot/bank-sync-status-dot';

interface Props extends Pick<AccountWithBankSyncEntityInterface, 'id' | 'title' | 'icon'> {
    readonly balance: number;
    readonly bankSync: BankSyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentSymbol: string;
}

export const BankSyncAccountCard = (props: Props) => {
    const { id, title, icon, balance, className, instrumentSymbol, bankSync } = props;

    const [, hapticImpact] = useVibration();

    const quickImportConfig = isDefined(bankSync) ? (quickImportConfigMap[bankSync.provider] ?? null) : null;
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
            <BankSyncStatusDot bankSync={bankSync} />
        </AccountCardBase>
    );
};
