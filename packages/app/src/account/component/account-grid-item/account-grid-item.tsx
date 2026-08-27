import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountCard } from '../account-card/account-card';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly balanceRow: HomeAccountBalanceInterface | null | undefined;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, balanceRow, type, isLeft }: Props) => {
    const { id, title, icon, externalId, instrument, deadline, debtType, targetBalance, createdAt, sync } = account;

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';
    const cardDebtProgressSummary = balanceRow?.debtProgressSummary;
    const cardTargetBalance = convertFromMicroUnits(targetBalance);

    return (
        <View className={containerClassName}>
            <AccountCard
                targetBalance={cardTargetBalance}
                type={type}
                id={id}
                balance={balance}
                deadline={deadline}
                debtType={debtType}
                icon={icon}
                externalId={externalId}
                title={title}
                createdAt={createdAt}
                sync={sync}
                debtProgressSummary={cardDebtProgressSummary}
                instrumentId={instrument.id}
                instrumentCode={instrument.code}
                instrumentSymbol={instrument.symbol}
            />
        </View>
    );
};
