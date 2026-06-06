import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountGridItem } from '../account-grid-item/account-grid-item';

import type { AccountRowInterface } from '../../interface/account-row.interface';

interface Props {
    readonly row: AccountRowInterface;
}

export const CryptoCurrencyGroupAccountRow = ({ row }: Props) => {
    const rightAccount = isDefined(row.right) ? (
        <AccountGridItem account={row.right} type={AccountTypeEnum.CRYPTO} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View className="flex-row">
            <AccountGridItem account={row.left} type={AccountTypeEnum.CRYPTO} isLeft />
            {rightAccount}
        </View>
    );
};
