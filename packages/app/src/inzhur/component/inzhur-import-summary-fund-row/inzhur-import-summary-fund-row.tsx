import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurFundChangeInterface } from '@budgie/sync';

interface Props {
    readonly fund: InzhurFundChangeInterface;
    readonly symbol: string;
}

const lineVariants = cva('', {
    variants: { isStacked: { true: 'gap-y-xxs', false: 'flex-row items-baseline gap-x-xl' } }
});

export const InzhurImportSummaryFundRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();
    const isStacked = useIsAccessibilityTextSize();
    const { isin, name, deltaQuantity, exchangedAmount, dividendAmount } = fund;

    const sign = deltaQuantity > 0 ? '+' : '−';
    const quantityLabel = `${sign}${formatFundQuantity(Math.abs(deltaQuantity))}`;
    const tradedAmount = Math.max(exchangedAmount - dividendAmount, 0);
    const tradeLabel = deltaQuantity > 0 ? t`Bought with Inzhur cash` : t`Sold for Inzhur cash`;
    const roles = [
        isPositiveNumber(dividendAmount) ? t`Reinvested dividends` : null,
        isPositiveNumber(tradedAmount) ? tradeLabel : null
    ].filter(isDefined);
    const detailLabel = [quantityLabel, ...roles].join(' · ');

    return (
        <View
            accessible
            accessibilityLabel={[name, formatAmount(exchangedAmount, symbol), detailLabel].join(', ')}
            className="flex-row items-center gap-x-xl px-3xl py-[12px]"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <NeutralIconTile icon={UserIconNameEnum.ChartLine} />
            <View className="flex-1 gap-y-xxs">
                <View className={lineVariants({ isStacked })}>
                    <Text className="flex-1 text-[17px] font-semibold text-primary" numberOfLines={2}>
                        {name}
                    </Text>
                    <MoneyText amount={exchangedAmount} instrumentSymbol={symbol} variant={MoneyTextVariantEnum.ROW} />
                </View>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground tabular-nums">{detailLabel}</Text>
            </View>
        </View>
    );
};
