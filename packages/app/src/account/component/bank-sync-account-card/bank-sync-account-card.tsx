import { AccountEntityInterface, BankSyncStatusEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useAccountBankSync } from '../../../sync/hook/use-account-bank-sync.hook';
import { AccountCardBase } from '../account-card-base/account-card-base';

interface Props extends Pick<AccountEntityInterface, 'id' | 'title' | 'icon'> {
    readonly className?: string;
    readonly instrumentSymbol: string;
}

const syncStatusVariants = cva('absolute bottom-3 right-3 size-2 rounded-full', {
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

    return (
        <AccountCardBase id={id} title={title} icon={icon} instrumentSymbol={instrumentSymbol} className={className}>
            {isDefined(bankSync) ? <View className={syncStatusVariants({ status: bankSync.status })} /> : null}
        </AccountCardBase>
    );
};
