import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { AccountRowInterface } from '../../interface/account-row.interface';
import { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import { AccountGridItem } from '../account-grid-item/account-grid-item';

interface Props {
    readonly row: AccountRowInterface;
    readonly accountType: AccountTypeEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly className?: string;
}

export const AccountGridRow = ({ row, accountType, balancesByAccountId, className }: Props) => {
    const leftBalance = balancesByAccountId.get(row.left.id)?.balance ?? 0;
    const rightAccount = row.right;
    const rightBalance = isDefined(rightAccount) ? (balancesByAccountId.get(rightAccount.id)?.balance ?? 0) : 0;
    const rightItem = isDefined(rightAccount) ? (
        <AccountGridItem account={rightAccount} balance={rightBalance} type={accountType} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View className={cn('flex-row', className)}>
            <AccountGridItem account={row.left} balance={leftBalance} type={accountType} isLeft />
            {rightItem}
        </View>
    );
};
