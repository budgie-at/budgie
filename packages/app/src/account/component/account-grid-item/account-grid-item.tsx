import { AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountCard } from '../account-card/account-card';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, type, isLeft }: Props) => {
    const { id, title, icon, instrument, deadline, debtType, targetBalance, createdAt } = account;

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';

    return (
        <View className={containerClassName}>
            <AccountCard
                targetBalance={convertFromMicroUnits(targetBalance)}
                type={type}
                id={id}
                deadline={deadline}
                debtType={debtType}
                icon={icon}
                title={title}
                createdAt={createdAt}
                instrumentSymbol={instrument.symbol}
            />
        </View>
    );
};
