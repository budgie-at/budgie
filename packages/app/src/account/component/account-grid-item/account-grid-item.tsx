import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountCard } from '../account-card/account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, type, isLeft }: Props) => {
    const { id, title, icon, instrument, deadline, debtType, targetBalance, createdAt, bankSync } = account;

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';

    return (
        <View className={containerClassName}>
            <AccountCard
                targetBalance={convertFromMicroUnits(targetBalance)}
                type={type}
                id={id}
                balance={balance}
                deadline={deadline}
                debtType={debtType}
                icon={icon}
                title={title}
                createdAt={createdAt}
                bankSync={bankSync}
                instrumentId={instrument.id}
                instrumentCode={instrument.code}
                instrumentSymbol={instrument.symbol}
            />
        </View>
    );
};
