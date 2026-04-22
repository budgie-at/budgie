import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountBalance = ({ balance, instrumentSymbol }: Props) => {
    return (
        <View className="p-5xl border border-default-corner bg-default-background gap-y-md rounded-3xl">
            <Text className="font-medium text-xs uppercase text-secondary-foreground text-center">
                <Trans>Current Balance</Trans>
            </Text>

            <ProtectedMoney
                className="justify-start"
                minFontSize={10}
                maxFontSize={36}
                instrumentSymbol={instrumentSymbol}
            >
                {balance}
            </ProtectedMoney>
        </View>
    );
};
