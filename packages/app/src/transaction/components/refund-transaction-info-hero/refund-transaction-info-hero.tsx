import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View, useWindowDimensions } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../../constant/transaction-info-hero-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TransactionInfoHeroDate } from '../transaction-info-hero-date/transaction-info-hero-date';
import { TransactionInfoHeroFade } from '../transaction-info-hero-fade/transaction-info-hero-fade';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly amount: string;
    readonly title: string;
    readonly onEndLayout: (event: LayoutChangeEvent) => void;
    readonly operatedAt: Date;
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
}

export const RefundTransactionInfoHero = ({ amount, title, operatedAt, onAmountLayout, onEndLayout }: Props) => {
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-start pt-xl pb-3xl' : 'items-center pt-3xl pb-5xl';
    const amountFontSize = largeText ? 34 : 40;
    const alignmentClassName = largeText ? 'text-left' : 'text-center';

    return (
        <View className={heroClassName}>
            {largeText ? null : (
                <TransactionInfoHeroFade className="mb-xl">
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
            )}
            <TransactionInfoHeroFade className="self-stretch">
                <AmountField fontSize={amountFontSize} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={TRANSACTION_INFO_STACKED_FONT_SCALE}
                        minimumFontScale={0.4}
                        testID={TransactionInfoPageSelector.Amount}
                        className={`leading-[48px] font-semibold tracking-[-1px] text-positive-strong ${alignmentClassName}`}
                        selectable
                    >
                        {amount}
                    </AmountFieldText>
                </AmountField>
            </TransactionInfoHeroFade>
            <TransactionInfoHeroFade onLayout={onAmountLayout}>
                <Text
                    maxFontSizeMultiplier={TRANSACTION_INFO_HERO_MAX_FONT_SCALE}
                    className={`mt-xs text-[20px] leading-[25px] text-primary font-semibold ${alignmentClassName}`}
                    selectable
                >
                    {title}
                </Text>
            </TransactionInfoHeroFade>
            <TransactionInfoHeroFade onLayout={onEndLayout}>
                <TransactionInfoHeroDate operatedAt={operatedAt} />
            </TransactionInfoHeroFade>
        </View>
    );
};
