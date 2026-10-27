import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountBalance = ({ balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();

    const formattedBalance = protectAmount(balance, instrumentSymbol);

    return (
        <View
            accessible
            accessibilityLabel={t`Current Balance: ${formattedBalance}`}
            className="p-5xl border gap-y-md rounded-3xl border-secondary-corner bg-ghost-background"
        >
            <Text className="text-secondary-foreground text-sm uppercase font-medium" numberOfLines={1}>
                <Trans>Current Balance</Trans>
            </Text>

            <ProtectedMoney className="justify-start" minFontSize={10} maxFontSize={36} instrumentSymbol={instrumentSymbol}>
                {balance}
            </ProtectedMoney>
        </View>
    );
};
