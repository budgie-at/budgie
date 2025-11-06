import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { formatMoney } from '../../../@generic/utils/format-money.util';

interface Props {
    balance: number;
}

export const AccountBalance = ({ balance }: Props) => (
    <View className={'p-[20px] border border-default-corner bg-default-background gap-y-[8px] rounded-[16px]'}>
        <Text className={'font-medium text-[12px] uppercase text-secondary-foreground'}>
            <Trans>Current Balance</Trans>
        </Text>
        <Text className={'text-primary text-[36px]'}>{formatMoney(balance)}</Text>
    </View>
);
