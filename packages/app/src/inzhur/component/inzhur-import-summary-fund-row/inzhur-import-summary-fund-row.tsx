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
    const tradedAmount = Math.max(exchangedAmount - dividendAmount, 0);
    const tradedLabel = formatAmount(tradedAmount, symbol);
    const dividendLabel = formatAmount(dividendAmount, symbol);
    const tradeLabel = deltaQuantity > 0 ? t`Bought with Inzhur cash · ${tradedLabel}` : t`Sold for Inzhur cash · ${tradedLabel}`;
    const details = [
        isPositiveNumber(dividendAmount) ? t`Reinvested dividends · ${dividendLabel}` : null,
        isPositiveNumber(tradedAmount) ? tradeLabel : null
    ].filter(isDefined);

    return (
        <View
            accessible
            accessibilityLabel={[name, quantityLabel, ...details].join(', ')}
            className="gap-y-xs p-3xl"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <Text className="text-[17px] font-semibold text-primary">{name}</Text>
            <Text className="text-[15px] leading-[20px] text-primary tabular-nums">{quantityLabel}</Text>
            {details.map(detail => (
                <Text key={detail} className="text-[15px] leading-[20px] text-secondary-foreground tabular-nums">
                    {detail}
                </Text>
            ))}
        </View>
    );
};
