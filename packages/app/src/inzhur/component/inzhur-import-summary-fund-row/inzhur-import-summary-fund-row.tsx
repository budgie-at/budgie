import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurFundChangeInterface } from '@budgie/sync';

interface Props {
    readonly fund: InzhurFundChangeInterface;
    readonly symbol: string;
}

export const InzhurImportSummaryFundRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();
    const { isin, name, deltaQuantity, exchangedAmount, dividendAmount } = fund;

    const sign = deltaQuantity > 0 ? '+' : '−';
    const quantityLabel = `${sign}${formatFundQuantity(Math.abs(deltaQuantity))}`;
    const boughtAmount = Math.max(exchangedAmount - dividendAmount, 0);
    const boughtLabel = formatAmount(boughtAmount, symbol);
    const dividendLabel = formatAmount(dividendAmount, symbol);
    const tradeLabel = deltaQuantity > 0 ? t`Bought ${boughtLabel}` : t`Sold ${boughtLabel}`;
    const details = [
        isPositiveNumber(boughtAmount) ? tradeLabel : null,
        isPositiveNumber(dividendAmount) ? t`Reinvested dividends ${dividendLabel}` : null
    ].filter(isDefined);

    return (
        <View
            accessible
            accessibilityLabel={[name, quantityLabel, ...details].join(', ')}
            className="min-h-[56px] flex-row items-center gap-x-xl px-3xl py-lg"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <Text className="flex-1 text-[17px] text-primary" numberOfLines={2}>
                {name}
            </Text>
            <View className="items-end gap-y-xxs">
                <Text className="text-[15px] font-semibold text-primary tabular-nums">{quantityLabel}</Text>
                {details.map(detail => (
                    <Text key={detail} className="text-[13px] text-secondary-foreground tabular-nums">
                        {detail}
                    </Text>
                ))}
            </View>
        </View>
    );
};
