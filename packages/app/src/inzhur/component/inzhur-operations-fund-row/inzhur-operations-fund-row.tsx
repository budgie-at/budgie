import { UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { InzhurOperationsFundSummaryInterface } from '@budgie/sync';

interface Props {
    readonly fund: InzhurOperationsFundSummaryInterface;
    readonly symbol: string;
}

export const InzhurOperationsFundRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();
    const { name, boughtQuantity, boughtAmount, soldQuantity, dividends, tax, isQuantityEstimated } = fund;

    const fundIcon = INZHUR_CANONICAL_FUNDS.find(canonicalFund => canonicalFund.name === name)?.icon ?? UserIconNameEnum.ChartLine;
    const boughtQuantityLabel = formatFundQuantity(boughtQuantity);
    const soldQuantityLabel = formatFundQuantity(soldQuantity);
    const dividendsLabel = formatAmount(dividends, symbol);
    const taxLabel = formatAmount(tax, symbol);
    const caption = joinWithMiddot([
        ...(isPositiveNumber(boughtQuantity) ? [t`Bought ${boughtQuantityLabel}`] : []),
        ...(isQuantityEstimated ? [t`quantity estimated`] : []),
        ...(isPositiveNumber(soldQuantity) ? [t`Sold ${soldQuantityLabel}`] : []),
        ...(isPositiveNumber(dividends) ? [t`Dividends ${dividendsLabel}`] : []),
        ...(isPositiveNumber(tax) ? [t`Tax ${taxLabel}`] : [])
    ]);

    return (
        <View className="min-h-[64px] justify-center px-3xl py-[12px]">
            <InzhurMoneyRow
                label={getInzhurShortTitle(name)}
                caption={caption}
                amount={boughtAmount}
                instrumentSymbol={symbol}
                icon={fundIcon}
            />
        </View>
    );
};
