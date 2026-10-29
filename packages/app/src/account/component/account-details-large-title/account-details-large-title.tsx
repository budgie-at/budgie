import { Text } from 'react-native';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'title'>;
}

export const AccountDetailsLargeTitle = ({ account }: Props) => (
    <Text className="max-w-full text-primary font-semibold text-2xl text-center" numberOfLines={1}>
        {account.title}
    </Text>
);
