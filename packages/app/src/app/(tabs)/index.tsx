import { AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react';
import { useLingui } from '@lingui/react/macro';
import { Pressable, Text } from 'react-native';

import { createAccountMutation } from '../../@account/mutation/create-account.mutation';
import { useGetAccountsQuery } from '../../@account/query/use-get-accounts.query';
import { Page } from '../../@generic/components/page/page';

export default function HomePage() {
    const { t } = useLingui();
    const { data } = useGetAccountsQuery();

    const onAdd = async () => {
        await createAccountMutation({
            balance: 0,
            title: 'example',
            currency: CurrencyEnum.UAH,
            type: AccountTypeEnum.CASH
        });
    };

    return (
        <Page>
            <Text className="text-text-primary">{t`Home Screen`}</Text>
            <Pressable onPress={() => void onAdd()}>
                <Text>{t`Create Account`}</Text>
            </Pressable>

            {data.map(account => (
                <Text key={account.id}>
                    <Trans
                        id="greeting"
                        message="ID: {accountId}. Created at: {createdAt}"
                        values={{ accountId: account.id, createdAt: account.createdAt.toTimeString() }}
                    />
                </Text>
            ))}
        </Page>
    );
}
