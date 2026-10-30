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
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
    readonly onTitleLayout: (event: LayoutChangeEvent) => void;
}

export const TransactionInfoHero = ({ transaction, matchingRuleIds, onTitleLayout }: Props) => {
    const { t } = useLingui();
    const formatDigits = useProtectedAmountLabel();
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-start pt-md pb-3xl' : 'items-center pt-3xl pb-5xl';
    const showIcon = !largeText && getTransactionType(transaction) === TransactionTypeEnum.TRANSFER;
    const alignmentClassName = largeText ? 'text-left' : 'text-center';
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
        <View className={heroClassName}>
            {showIcon ? (
                <TransactionInfoHeroFade className="mb-xl">
                    <TransactionInfoHeroIcon />
                </TransactionInfoHeroFade>
            ) : null}

            <TransactionInfoHeroFade className="self-stretch">
                <AmountField fontSize={amountFontSize} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={TRANSACTION_INFO_AMOUNT_MAX_FONT_SCALE}
                        minimumFontScale={0.6}
                        testID={TransactionInfoPageSelector.Amount}
                        className={cn('leading-[48px] font-semibold tracking-[-1px] ', alignmentClassName, amountClassName)}
                        selectable
                    >
                        {formatTransactionInfoAmount(transaction, formatDigits)}
                    </AmountFieldText>
                </AmountField>
            </TransactionInfoHeroFade>

            {isNotEmptyString(destinationAmount) ? (
                <TransactionInfoHeroFade>
                    <Text
                        maxFontSizeMultiplier={TRANSACTION_INFO_STACKED_FONT_SCALE}
                        className="text-[15px] leading-[20px] text-transaction-detail-secondary tabular-nums"
                        selectable
                    >
                        {destinationAmount}
                    </Text>
                </TransactionInfoHeroFade>
            ) : null}

            <TransactionInfoHeroFade onLayout={onTitleLayout}>
                {isNotEmptyString(title) ? (
                    <Text
                        maxFontSizeMultiplier={TRANSACTION_INFO_HERO_MAX_FONT_SCALE}
                        className={`mt-xs text-[20px] leading-[25px] text-primary font-semibold ${alignmentClassName}`}
                        selectable
                    >
                        {title}
                    </Text>
                ) : null}
            </TransactionInfoHeroFade>
            <TransactionInfoHeroFade>
                <TransactionInfoHeroDate operatedAt={transaction.operatedAt} />
            </TransactionInfoHeroFade>

            {isNotEmptyArray(matchingRuleIds) ? (
                <TransactionInfoHeroFade className="mt-xl flex-row flex-wrap items-center justify-center gap-sm">
                    <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
                </TransactionInfoHeroFade>
            ) : null}
        </View>
    );
};
