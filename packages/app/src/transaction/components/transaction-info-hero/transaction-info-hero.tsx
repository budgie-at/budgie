import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View, useWindowDimensions } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { TRANSACTION_INFO_MAX_FONT_SCALE } from '../../constant/transaction-info-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { useProtectedInstrumentAmountLabel } from '../../hook/use-protected-instrument-amount-label.hook';
import { useTransactionRowTitle } from '../../hook/use-transaction-row-title.hook';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { formatTransactionInfoDestination } from '../../utils/format-transaction-info-destination.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
import { TransactionInfoHeroDate } from '../transaction-info-hero-date/transaction-info-hero-date';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly matchingRuleIds: readonly number[];
    readonly onAmountLayout: (event: LayoutChangeEvent) => void;
    readonly onTitleLayout: (event: LayoutChangeEvent) => void;
}

export const TransactionInfoHero = ({ transaction, matchingRuleIds, onAmountLayout, onTitleLayout }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedInstrumentAmountLabel();
    const rowTitle = useTransactionRowTitle(transaction);
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const heroClassName = largeText ? 'items-center pt-md pb-3xl' : 'items-center pt-3xl pb-5xl';
    const showIcon = getTransactionType(transaction) === TransactionTypeEnum.TRANSFER;
    const amountClassName = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? 'text-positive-strong' : 'text-primary';
    const title = isNotEmptyString(rowTitle) ? rowTitle : t(TRANSACTION_TYPE[transaction.type]);
    const destinationAmount = formatTransactionInfoDestination(transaction, formatAmount);
    const amountFontSize = largeText ? 34 : 40;

    return (
        <View className={heroClassName}>
            {showIcon ? (
                <View className="mb-xl">
                    <CircleIcon
                        icon={UserIconNameEnum.ArrowRightLeft}
                        variant="default"
                        size={64}
                        iconSize={30}
                        radius={32}
                        border={false}
                        iconClassName="text-default-foreground"
                    />
                </View>
            ) : null}

            <View onLayout={onAmountLayout} className="self-stretch">
                <AmountField fontSize={amountFontSize} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        maxFontSizeMultiplier={TRANSACTION_INFO_MAX_FONT_SCALE}
                        minimumFontScale={0.6}
                        testID={TransactionInfoPageSelector.Amount}
                        className={cn('leading-[48px] font-semibold tracking-[-1px] text-center', amountClassName)}
                        selectable
                    >
                        {formatTransactionInfoAmount(transaction, formatAmount)}
                    </AmountFieldText>
                </AmountField>
            </View>

            {isNotEmptyString(destinationAmount) ? (
                <Text
                    maxFontSizeMultiplier={TRANSACTION_INFO_MAX_FONT_SCALE}
                    className="text-[17px] leading-[22px] text-transaction-detail-secondary font-medium text-center tabular-nums"
                    selectable
                >
                    {destinationAmount}
                </Text>
            ) : null}

            {isNotEmptyString(title) ? (
                <Text
                    onLayout={onTitleLayout}
                    maxFontSizeMultiplier={TRANSACTION_INFO_MAX_FONT_SCALE}
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
        </View>
    );
};
