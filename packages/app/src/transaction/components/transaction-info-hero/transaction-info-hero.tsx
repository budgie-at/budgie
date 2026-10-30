import { AmountField, AmountFieldText } from '@budgie/amount-input';
import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { MatchingRulesPill } from '../../../rule/components/matching-rules-pill/matching-rules-pill';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionInfoDestinationEntry } from '../../utils/get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from '../../utils/get-transaction-info-primary-entry.util';
import { getTransactionType } from '../../utils/get-transaction-type.util';
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
    const { formatWeekdayAndDateWithTime } = useFormatDate();
    const amountClassName = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? 'text-positive-strong' : 'text-primary';
    const displayTitle = getTransactionDisplayTitle(transaction);
    const title = isNotEmptyString(displayTitle) ? displayTitle : t(TRANSACTION_TYPE[transaction.type]);
    const formattedAmount = formatTransactionInfoAmount(transaction, formatDigits);
    const sourceEntry = getTransactionInfoPrimaryEntry(transaction);
    const destinationEntry = getTransactionInfoDestinationEntry(transaction);
    const isCrossCurrency =
        isDefined(sourceEntry) &&
        isDefined(destinationEntry) &&
        sourceEntry.account.instrument.id !== destinationEntry.account.instrument.id;
    const destinationAmount =
        isCrossCurrency && isDefined(destinationEntry)
            ? `→ ${formatDigits(convertFromMicroUnits(destinationEntry.amount), destinationEntry.account.instrument.symbol)}`
            : null;

    return (
        <View className="items-center pt-3xl pb-5xl">
            <TransactionInfoHeroFade>
                <TransactionInfoHeroIcon transaction={transaction} />
            </TransactionInfoHeroFade>

            <View onLayout={onTitleLayout} className="mt-xl self-stretch">
                <AmountField fontSize={40} className="self-stretch">
                    <AmountFieldText
                        adjustsFontSizeToFit
                        minimumFontScale={0.4}
                        testID={TransactionInfoPageSelector.Amount}
                        className={cn('leading-[48px] font-semibold tracking-[-1px] text-center', amountClassName)}
                        selectable
                    >
                        {formattedAmount}
                    </AmountFieldText>
                </AmountField>
            </View>

            {isNotEmptyString(destinationAmount) ? (
                <Text className="text-[15px] leading-[20px] text-secondary-foreground tabular-nums" selectable>
                    {destinationAmount}
                </Text>
            ) : null}

            <View>
                {isNotEmptyString(title) ? (
                    <Text className="mt-xs text-[20px] leading-[25px] text-primary font-semibold text-center" selectable>
                        {title}
                    </Text>
                ) : null}
            </View>
            <View>
                <Text className="mt-sm text-[15px] leading-[20px] text-secondary-foreground text-center">
                    {formatWeekdayAndDateWithTime(transaction.operatedAt)}
                </Text>
            </View>

            {isNotEmptyArray(matchingRuleIds) ? (
                <View className="mt-xl flex-row flex-wrap items-center justify-center gap-sm">
                    <MatchingRulesPill matchingRulesCount={matchingRuleIds.length} matchingRuleIds={matchingRuleIds} />
                </View>
            ) : null}
        </View>
    );
};
