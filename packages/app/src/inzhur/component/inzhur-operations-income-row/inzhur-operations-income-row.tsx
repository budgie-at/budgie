import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { InzhurOperationsFundSummaryInterface } from '@budgie/sync';

interface Props {
    readonly fund: Pick<InzhurOperationsFundSummaryInterface, 'name' | 'dividends' | 'tax'>;
    readonly symbol: string;
}

export const InzhurOperationsIncomeRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useFormatDigits(2);

    const taxLabel = formatAmount(fund.tax, symbol);
    const captionSegments = isPositiveNumber(fund.tax) ? [t`Tax ${taxLabel}`] : [];

    return (
        <View className="min-h-[64px] justify-center px-3xl py-[12px]">
            <InzhurMoneyRow
                label={getInzhurShortTitle(fund.name)}
                captionSegments={captionSegments}
                amount={fund.dividends}
                instrumentSymbol={symbol}
                icon={UserIconNameEnum.RefreshCw}
            />
        </View>
    );
};
