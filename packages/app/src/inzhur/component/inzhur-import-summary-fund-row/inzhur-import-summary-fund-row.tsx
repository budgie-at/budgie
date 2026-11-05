import { UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { ListRow } from '../../../@generic/component/list-row/list-row';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';

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

    const fundIcon = INZHUR_CANONICAL_FUNDS.find(canonicalFund => canonicalFund.name === name)?.icon ?? UserIconNameEnum.ChartLine;
    const quantityLabel = `${deltaQuantity > 0 ? '+' : '−'}${formatFundQuantity(Math.abs(deltaQuantity)).replaceAll(' ', '\u00A0')}`;
    const hasPurchase = isPositiveNumber(Math.max(exchangedAmount - dividendAmount, 0));
    const purchaseLabel = isPositiveNumber(dividendAmount) ? t`Bought with dividends · estimated` : t`Bought`;
    const buyRoleLabel = hasPurchase ? purchaseLabel : t`Reinvested dividends · estimated`;
    const detailLabel = `${deltaQuantity > 0 ? buyRoleLabel : t`Sold`} · ${quantityLabel}`;

    return (
        <View
            accessible
            accessibilityLabel={[name, formatAmount(exchangedAmount, symbol), detailLabel].join(', ')}
            className="px-3xl py-[12px]"
            testID={InzhurSelector.SummaryFund(isin)}
        >
            <ListRow
                leading={<NeutralIconTile icon={fundIcon} />}
                title={<Text className="text-[17px] font-semibold text-primary">{getInzhurShortTitle(name)}</Text>}
                trailing={<MoneyText amount={exchangedAmount} instrumentSymbol={symbol} variant={MoneyTextVariantEnum.ROW} />}
                detail={<Text className="text-[13px] leading-[18px] text-secondary-foreground tabular-nums">{detailLabel}</Text>}
            />
        </View>
    );
};
