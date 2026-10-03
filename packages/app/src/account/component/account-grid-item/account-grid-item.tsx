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
    const { id, title, icon, externalId, instrument, targetBalance, sync } = account;

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';
    const cardTargetBalance = convertFromMicroUnits(targetBalance);

    return (
        <View className={containerClassName}>
            <AccountCard
                targetBalance={cardTargetBalance}
                type={type}
                id={id}
                balance={balance}
                icon={icon}
                externalId={externalId}
                title={title}
                sync={sync}
                instrumentId={instrument.id}
                instrumentCode={instrument.code}
                instrumentSymbol={instrument.symbol}
            />
        </View>
    );
};
