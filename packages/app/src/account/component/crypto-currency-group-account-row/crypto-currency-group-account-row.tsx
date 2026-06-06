import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountGridItem } from '../account-grid-item/account-grid-item';

import type { AccountRowInterface } from '../../interface/account-row.interface';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';

interface Props {
    readonly row: AccountRowInterface;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const CryptoCurrencyGroupAccountRow = ({ row, balancesByAccountId }: Props) => {
    const leftBalance = balancesByAccountId.get(row.left.id)?.balance ?? 0;
    const rightAccount = row.right;
    const rightBalance = isDefined(rightAccount) ? (balancesByAccountId.get(rightAccount.id)?.balance ?? 0) : 0;
    const rightItem = isDefined(rightAccount) ? (
        <AccountGridItem account={rightAccount} balance={rightBalance} type={AccountTypeEnum.CRYPTO} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View className="flex-row">
            <AccountGridItem account={row.left} balance={leftBalance} type={AccountTypeEnum.CRYPTO} isLeft />
            {rightItem}
        </View>
    );
};
