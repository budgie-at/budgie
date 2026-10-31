import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { useAmountFormat } from '../../../@generic/hook/use-amount-format.hook';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly value: number;
    readonly caption: string;
    readonly instrumentSymbol: string;
    readonly minimumDecimalPlaces: number;
}

export const AccountBalanceReadout = ({ value, caption, instrumentSymbol, minimumDecimalPlaces }: Props) => {
    const format = useAmountFormat(minimumDecimalPlaces);

    const isNegative = value < 0;
    const sign = isNegative ? '−' : '';

    return (
        <View className="pb-xl">
            <View className="flex-row items-center gap-x-xs px-4 pt-md">
                <Icon icon={UserIconNameEnum.Lock} size={12} className="text-secondary-foreground" />
                <Text className="text-secondary-foreground text-[13px] font-medium">{caption}</Text>
            </View>
            <View className="h-[88px] flex-row items-center px-4">
                <Text className="text-primary text-[38px]">{`${sign}${instrumentSymbol}`}</Text>
                <Text
                    className="text-primary flex-1 text-[64px] tabular-nums"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    testID={CreateAccountSelector.Amount}
                >
                    {format.format(Math.abs(value))}
                </Text>
            </View>
        </View>
    );
};
