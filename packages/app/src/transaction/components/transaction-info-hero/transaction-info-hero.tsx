import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View, useWindowDimensions } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE } from '../../constant/transaction-info-amount-max-font-scale.constant';
import { TRANSACTION_INFO_HERO_MAX_FONT_SCALE } from '../../constant/transaction-info-hero-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionInfoDestinationEntry } from '../../utils/get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from '../../utils/get-transaction-info-primary-entry.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionInfoHeroDate } from '../transaction-info-hero-date/transaction-info-hero-date';
import { TransactionInfoHeroFade } from '../transaction-info-hero-fade/transaction-info-hero-fade';
import { TransactionInfoHeroIcon } from '../transaction-info-hero-icon/transaction-info-hero-icon';
import { TransactionInfoHeroTravel } from '../transaction-info-hero-travel/transaction-info-hero-travel';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionInfoHandoffInterface } from '../../interface/transaction-info-handoff.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
    readonly handoff: TransactionInfoHandoffInterface;
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
    readonly onTextLayout: (event: LayoutChangeEvent) => void;
}

export const TransactionInfoHero = ({ transaction, matchingRuleIds, handoff, onAmountLayout, onTextLayout }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-center pt-md pb-3xl' : 'items-center pt-3xl pb-5xl';
    const showIcon = !largeText && getTransactionType(transaction) === TransactionTypeEnum.TRANSFER;
    const amountClassName = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? 'text-positive-strong' : 'text-primary';
    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const sourceEntry = getTransactionInfoPrimaryEntry(transaction);
    const destinationEntry = getTransactionInfoDestinationEntry(transaction);
    const destinationAmount =
        isDefined(sourceEntry) &&
        isDefined(destinationEntry) &&
        sourceEntry.account.instrument.id !== destinationEntry.account.instrument.id
            ? `→ ${formatDigits(convertFromMicroUnits(destinationEntry.amount), destinationEntry.account.instrument.symbol)}`
            : null;
    const amountFontSize = largeText ? 34 : 40;

    return (
        <TransactionInfoHeroTravel handoff={handoff} className={heroClassName}>
            <TransactionInfoHeroFade range={handoff.amountFadeRange} onLayout={onAmountLayout} className="self-stretch items-center">
                {showIcon ? (
                    <View className="mb-xl">
                        <TransactionInfoHeroIcon />
                    </View>
                ) : null}

                <AmountField fontSize={amountFontSize} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE}
                        minimumFontScale={0.6}
                        testID={TransactionInfoPageSelector.Amount}
                        className={cn('leading-[48px] font-semibold tracking-[-1px] text-center', amountClassName)}
                        selectable
                    >
                        {formatTransactionInfoAmount(transaction, formatDigits)}
                    </AmountFieldText>
                </AmountField>

                {isNotEmptyString(destinationAmount) ? (
                    <Text
                        maxFontSizeMultiplier={TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE}
                        className="text-[17px] leading-[22px] text-transaction-detail-secondary font-medium text-center tabular-nums"
                        selectable
                    >
                        {destinationAmount}
                    </Text>
                ) : null}
            </TransactionInfoHeroFade>

            <TransactionInfoHeroFade range={handoff.textFadeRange} onLayout={onTextLayout} className="self-stretch items-center">
                {isNotEmptyString(title) ? (
                    <Text
                        maxFontSizeMultiplier={TRANSACTION_INFO_HERO_MAX_FONT_SCALE}
                        className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center"
                        selectable
                    >
                        {title}
                    </Text>
                ) : null}
                <TransactionInfoHeroDate operatedAt={transaction.operatedAt} />

                {isNotEmptyArray(matchingRuleIds) ? (
                    <View className="mt-xl flex-row flex-wrap items-center justify-center gap-sm">
                        <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
                    </View>
                ) : null}
            </TransactionInfoHeroFade>
        </TransactionInfoHeroTravel>
    );
};
