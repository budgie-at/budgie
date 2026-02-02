import { AccountEntityInterface, BankSyncStatusEnum, ExternalSourceEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { useAccountBankSync } from '../../../sync/hook/use-account-bank-sync.hook';
import { usePrivatbankQuickImport } from '../../../sync/hook/use-privatbank-quick-import.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 size-2 rounded-full will-change-animation', {
    variants: {
        status: {
            [BankSyncStatusEnum.SYNCING]: 'bg-amber-500 animate-pulse',
            [BankSyncStatusEnum.IDLE]: 'bg-green-500',
            [BankSyncStatusEnum.FAILED]: 'bg-destructive'
        }
    }
});

export const BankSyncAccountCard = (props: Props) => {
    const { id, title, icon, className, instrumentSymbol } = props;

    const { bankSync } = useAccountBankSync(id);
    const { handleQuickImport } = usePrivatbankQuickImport();

    const shouldShow = isDefined(bankSync);
    const isPrivatbank = isDefined(bankSync) && bankSync.provider === ExternalSourceEnum.PRIVATBANK;
    const longPressHandler = isPrivatbank ? handleQuickImport : emptyFn;
    const statusClassName = shouldShow
        ? syncStatusVariants({ status: bankSync.status })
        : syncStatusVariants({ status: BankSyncStatusEnum.IDLE });
    const statusStyle = { opacity: shouldShow ? 1 : 0 };

    return (
        <AccountCardBase
            id={id}
            title={title}
            icon={icon}
            instrumentSymbol={instrumentSymbol}
            className={className}
            onLongPress={longPressHandler}
        >
            <View className={statusClassName} style={statusStyle} />
        </AccountCardBase>
    );
};
