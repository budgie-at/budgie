import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { Text, View, useWindowDimensions } from 'react-native';

import { TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE } from '../../constant/transaction-info-amount-max-font-scale.constant';
import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../../constant/transaction-info-hero-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TransactionInfoHeroDate } from '../transaction-info-hero-date/transaction-info-hero-date';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly amount: string;
    readonly title: string;
    readonly operatedAt: Date;
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
    readonly onTitleLayout: (event: LayoutChangeEvent) => void;
}

export const RefundTransactionInfoHero = ({ amount, title, operatedAt, onAmountLayout, onTitleLayout }: Props) => {
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-center pt-md pb-3xl' : 'items-center pt-3xl pb-5xl';
    const amountFontSize = largeText ? 34 : 40;

    return (
        <View className={heroClassName}>
            <View onLayout={onAmountLayout} className="self-stretch">
                <AmountField fontSize={amountFontSize} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE}
                        minimumFontScale={0.6}
                        testID={TransactionInfoPageSelector.Amount}
                        className="leading-[48px] font-semibold tracking-[-1px] text-positive-strong text-center"
                        selectable
                    >
                        {amount}
                    </AmountFieldText>
                </AmountField>
            </View>
            <Text
                onLayout={onTitleLayout}
                maxFontSizeMultiplier={TRANSACTION_INFO_HERO_MAX_FONT_SCALE}
                className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center"
                selectable
            >
                {title}
            </Text>
            <TransactionInfoHeroDate operatedAt={operatedAt} />
        </View>
    );
};
