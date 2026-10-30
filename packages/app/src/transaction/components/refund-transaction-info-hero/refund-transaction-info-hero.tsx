import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { Text, useWindowDimensions } from 'react-native';

import { TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE } from '../../constant/transaction-info-amount-max-font-scale.constant';
import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../../constant/transaction-info-hero-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TransactionInfoHeroDate } from '../transaction-info-hero-date/transaction-info-hero-date';
import { TransactionInfoHeroFade } from '../transaction-info-hero-fade/transaction-info-hero-fade';
import { TransactionInfoHeroTravel } from '../transaction-info-hero-travel/transaction-info-hero-travel';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionInfoHandoffInterface } from '../../interface/transaction-info-handoff.interface';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly amount: string;
    readonly title: string;
    readonly operatedAt: Date;
    readonly handoff: TransactionInfoHandoffInterface;
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
    readonly onTextLayout: (event: LayoutChangeEvent) => void;
}

export const RefundTransactionInfoHero = ({ amount, title, operatedAt, handoff, onAmountLayout, onTextLayout }: Props) => {
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-center pt-md pb-3xl' : 'items-center pt-3xl pb-5xl';
    const amountFontSize = largeText ? 34 : 40;

    return (
        <TransactionInfoHeroTravel handoff={handoff} className={heroClassName}>
            <TransactionInfoHeroFade range={handoff.amountFadeRange} onLayout={onAmountLayout} className="self-stretch">
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
            </TransactionInfoHeroFade>
            <TransactionInfoHeroFade range={handoff.textFadeRange} onLayout={onTextLayout} className="self-stretch items-center">
                <Text
                    maxFontSizeMultiplier={TRANSACTION_INFO_HERO_MAX_FONT_SCALE}
                    className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center"
                    selectable
                >
                    {title}
                </Text>
                <TransactionInfoHeroDate operatedAt={operatedAt} />
            </TransactionInfoHeroFade>
        </TransactionInfoHeroTravel>
    );
};
