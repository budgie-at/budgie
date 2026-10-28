import { Text, View } from 'react-native';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';

interface Props {
    readonly title: string;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountDetailsSmallTitle = ({ title, balance, instrumentSymbol }: Props) => {
    const protectAmount = useProtectedAmountLabel();

    return (
        <View className="items-center">
            <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
                {title}
            </Text>
            <Text className="text-secondary-foreground text-xs text-center" numberOfLines={1}>
                {protectAmount(balance, instrumentSymbol)}
            </Text>
        </View>
    );
};
