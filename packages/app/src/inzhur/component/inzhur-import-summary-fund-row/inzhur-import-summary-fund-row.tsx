import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurFundChangeInterface } from '@budgie/sync';

interface Props {
    readonly fund: InzhurFundChangeInterface;
    readonly symbol: string;
}

const QUANTITY_DECIMAL_PLACES = 6;

export const InzhurImportSummaryFundRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatQuantity = useFormatDigits(0, QUANTITY_DECIMAL_PLACES);
    const formatAmount = useFormatDigits(2);
    const { isin, name, deltaQuantity, exchangedAmount, dividendAmount } = fund;

    const quantityLabel = `${deltaQuantity > 0 ? '+' : ''}${formatQuantity(deltaQuantity)}`;
    const exchangedLabel = formatAmount(exchangedAmount, symbol);
    const dividendLabel = formatAmount(dividendAmount, symbol);
    const details = [
        isPositiveNumber(exchangedAmount) ? t`Exchanged for ${exchangedLabel}` : null,
        isPositiveNumber(dividendAmount) ? t`Estimated dividends ${dividendLabel}` : null
    ].filter(isDefined);
    const subtitle = details.map(detail => (
        <Text key={detail} className="text-secondary-foreground text-[13px] leading-[18px]">
            {detail}
        </Text>
    ));

    return (
        <GroupedListRow
            testID={InzhurSelector.SummaryFund(isin)}
            title={name}
            subtitle={subtitle}
            right={<Text className="text-primary text-[17px] font-semibold tabular-nums">{quantityLabel}</Text>}
        />
    );
};
