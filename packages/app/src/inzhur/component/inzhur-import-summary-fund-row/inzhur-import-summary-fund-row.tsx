import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurSummaryAmountLine } from '../inzhur-summary-amount-line/inzhur-summary-amount-line';

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
    const tradedAmount = Math.max(exchangedAmount - dividendAmount, 0);
    const tradeLabel = deltaQuantity > 0 ? t`Bought with Inzhur cash` : t`Sold for Inzhur cash`;
    const lines = [
        isPositiveNumber(dividendAmount) ? { label: t`Reinvested dividends`, value: formatAmount(dividendAmount, symbol) } : null,
        isPositiveNumber(tradedAmount) ? { label: tradeLabel, value: formatAmount(tradedAmount, symbol) } : null
    ].filter(isDefined);

    return (
        <View
            accessible
            accessibilityLabel={[name, quantityLabel, ...lines.map(line => `${line.label} ${line.value}`)].join(', ')}
            className="gap-y-xxs px-3xl py-[12px]"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <View className="flex-row items-baseline gap-x-xl">
                <Text className="flex-1 text-[17px] font-semibold text-primary" numberOfLines={2}>
                    {name}
                </Text>
                <Text className="text-[17px] font-semibold text-primary tabular-nums">{quantityLabel}</Text>
            </View>
            {lines.map(line => (
                <InzhurSummaryAmountLine key={line.label} label={line.label} value={line.value} />
            ))}
        </View>
    );
};
