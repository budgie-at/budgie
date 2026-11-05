import { UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';

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

    const fundIcon = INZHUR_CANONICAL_FUNDS.find(canonicalFund => canonicalFund.name === name)?.icon ?? UserIconNameEnum.ChartLine;
    const quantityLabel = `${deltaQuantity > 0 ? '+' : '−'}${formatFundQuantity(Math.abs(deltaQuantity))}`;
    const tradedAmount = Math.max(exchangedAmount - dividendAmount, 0);
    const hasDividends = isPositiveNumber(dividendAmount);
    const hasPurchase = isPositiveNumber(tradedAmount);
    const purchaseLabel = hasDividends ? t`Purchase with reinvested dividends` : t`Purchase`;
    const buyRoleLabel = hasPurchase ? purchaseLabel : t`Reinvested dividends`;
    const roleLabel = deltaQuantity > 0 ? buyRoleLabel : t`Sale`;
    const detailLabel = `${roleLabel} · ${quantityLabel}`;

    return (
        <View
            accessible
            accessibilityLabel={[name, formatAmount(exchangedAmount, symbol), detailLabel].join(', ')}
            className="flex-row items-center gap-x-xl px-3xl py-[12px]"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <NeutralIconTile icon={fundIcon} />
            <View className="flex-1 gap-y-xxs">
                <View className={lineVariants({ isStacked })}>
                    <Text className="flex-1 text-[17px] font-semibold text-primary" numberOfLines={2}>
                        {getInzhurShortTitle(name)}
                    </Text>
                    <MoneyText amount={exchangedAmount} instrumentSymbol={symbol} variant={MoneyTextVariantEnum.ROW} />
                </View>
                <Text className="text-[13px] leading-[18px] text-secondary-foreground tabular-nums">{detailLabel}</Text>
            </View>
        </View>
    );
};
