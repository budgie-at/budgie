import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { AccountCard } from '../account-card/account-card';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithBankSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithBankSyncEntityInterface;
    readonly balance: number;
    readonly balanceRow: HomeAccountBalanceInterface | null | undefined;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, balanceRow, type, isLeft }: Props) => {
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
                debtProgressSummary={balanceRow?.debtProgressSummary}
                instrumentId={instrument.id}
                instrumentCode={instrument.code}
                instrumentSymbol={instrument.symbol}
            />
        </View>
    );
};
