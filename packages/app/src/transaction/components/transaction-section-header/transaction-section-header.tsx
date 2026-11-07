import { convertFromMicroUnits } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';

import type { TransactionsDayNetAmountInterface } from '../../interface/transactions-day-net-amount.interface';

interface Props {
    readonly title: string;
    readonly netAmount: TransactionsDayNetAmountInterface | null;
}

export const TransactionSectionHeader = ({ title, netAmount }: Props) => {
    const hasNetAmount = isDefined(netAmount) && netAmount.amount !== 0;
    const netAmountSign = hasNetAmount && isPositiveNumber(netAmount.amount) ? '+' : '−';
    const approximatePrefix = hasNetAmount && netAmount.isApproximate ? '≈ ' : '';

    return (
        <View className="min-h-[32px] flex-row flex-wrap items-center justify-between gap-x-md px-3xl py-xs">
            <Text
                maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                className="shrink text-primary text-[13px] font-semibold"
                numberOfLines={2}
            >
                {title}
            </Text>
            {hasNetAmount ? (
                <View className="shrink-0">
                    <MoneyText
                        amount={Math.abs(convertFromMicroUnits(netAmount.amount))}
                        instrumentSymbol={netAmount.instrumentSymbol}
                        variant={MoneyTextVariantEnum.CAPTION}
                        prefix={`${approximatePrefix}${netAmountSign}`}
                    />
                </View>
            ) : null}
        </View>
    );
};
