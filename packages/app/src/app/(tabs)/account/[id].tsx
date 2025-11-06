import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AccountBalance } from '../../../@account/components/account-balance/account-balance';
import { AccountHeader } from '../../../@account/components/account-header/account-header';
import { useGetAccountByIdQuery } from '../../../@account/query/use-get-account-by-id.query';
import { Page } from '../../../@generic/components/page/page';

export default function Account() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data } = useGetAccountByIdQuery(Number(id));
    const [account] = data;

    if (!isDefined(account)) {
        return <Redirect href="/" />;
    }

    return (
        <Page header={<AccountHeader showBackBtn title={account.title} icon={'Check'} type={account.type} />}>
            <View className={'py-[30px]'}>
                <AccountBalance balance={account.balance} />
            </View>
        </Page>
    );
}
