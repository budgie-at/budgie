import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionInfoHeroFade } from '../transaction-info-hero-fade/transaction-info-hero-fade';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly amount: string;
    readonly title: string;
    readonly operatedAt: Date;
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
}

export const RefundTransactionInfoHero = ({ amount, title, operatedAt, onAmountLayout }: Props) => {
    const { formatWeekdayAndDateWithTime } = useFormatDate();

    return (
        <View className="items-center pt-3xl pb-5xl">
            <TransactionInfoHeroFade>
                <CircleIcon
                    icon={UserIconNameEnum.RotateCcw}
                    variant="positive"
                    size={64}
                    iconSize={30}
                    radius={32}
                    border={false}
                    iconClassName="text-positive-strong"
                />
            </TransactionInfoHeroFade>
            <View className="mt-xl self-stretch" onLayout={onAmountLayout}>
                <AmountField fontSize={40} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                        testID={TransactionInfoPageSelector.Amount}
                        className="leading-[48px] font-semibold tracking-[-1px] text-center text-positive-strong"
                        selectable
                    >
                        {amount}
                    </AmountFieldText>
                </AmountField>
            </View>
            <View>
                <Text className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center" selectable>
                    {title}
                </Text>
            </View>
            <View>
                <Text className="mt-sm text-[15px] leading-[20px] text-secondary-foreground text-center">
                    {formatWeekdayAndDateWithTime(operatedAt)}
                </Text>
            </View>
        </View>
    );
};
