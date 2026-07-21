import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { AccountGridItem } from '../account-grid-item/account-grid-item';

import type { AccountRowInterface } from '../../interface/account-row.interface';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';

interface Props {
    readonly row: AccountRowInterface;
    readonly accountType: AccountTypeEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly className?: string;
}

export const AccountGridRow = ({ row, accountType, balancesByAccountId, className }: Props) => {
    const leftBalanceRow = balancesByAccountId.get(row.left.id);
    const leftBalance = isDefined(leftBalanceRow) ? leftBalanceRow.balance : 0;
    const rightBalanceRow = isDefined(row.right) ? balancesByAccountId.get(row.right.id) : null;
    const rightBalance = isDefined(rightBalanceRow) ? rightBalanceRow.balance : 0;
    const rightItem = isDefined(row.right) ? (
        <AccountGridItem account={row.right} balance={rightBalance} balanceRow={rightBalanceRow} type={accountType} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View className={cn('flex-row items-start', className)}>
            <AccountGridItem account={row.left} balance={leftBalance} balanceRow={leftBalanceRow} type={accountType} isLeft />
            {rightItem}
        </View>
    );
};
