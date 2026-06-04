import { AccountTypeEnum } from '@budgie/contracts';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountRowInterface } from '../../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../../interface/crypto-currency-group.interface';
import { AccountGridItem } from '../account-grid-item/account-grid-item';

interface Props {
    readonly group: CryptoCurrencyGroupInterface;
}

const pairAccountsIntoRows = (group: CryptoCurrencyGroupInterface): AccountRowInterface[] => {
    const rows: AccountRowInterface[] = [];

    for (let index = 0; index < group.accounts.length; index += 2) {
        rows.push({
            left: group.accounts[index],
            right: group.accounts[index + 1]
        });
    }

    return rows;
};

const renderAccountRow = (row: AccountRowInterface) => {
    const rightAccount = isDefined(row.right) ? (
        <AccountGridItem account={row.right} type={AccountTypeEnum.CRYPTO} isLeft={false} />
    ) : (
        <View className="flex-1" />
    );

    return (
        <View key={row.left.id} className="flex-row">
            <AccountGridItem account={row.left} type={AccountTypeEnum.CRYPTO} isLeft />
            {rightAccount}
        </View>
    );
};

export const CryptoCurrencyGroupAccounts = ({ group }: Props) => {
    const rows = pairAccountsIntoRows(group);

    return <View className="gap-y-3">{rows.map(renderAccountRow)}</View>;
};
