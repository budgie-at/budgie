import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { getInzhurShortTitle } from '../../utils/get-inzhur-short-title.util';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { InzhurOperationsFundSummaryInterface } from '@budgie/sync';

interface Props {
    readonly fund: Pick<InzhurOperationsFundSummaryInterface, 'name' | 'dividends' | 'tax'>;
    readonly symbol: string;
}

export const InzhurOperationsIncomeRow = ({ fund, symbol }: Props) => {
    const { t } = useLingui();
    const formatAmount = useProtectedAmountLabel();

    const taxLabel = formatAmount(fund.tax, symbol);
    const captionSegments = isPositiveNumber(fund.tax) ? [t`Tax ${taxLabel}`] : [];

    return (
        <InzhurMoneyRow
            label={getInzhurShortTitle(fund.name)}
            captionSegments={captionSegments}
            amount={fund.dividends}
            instrumentSymbol={symbol}
            icon={UserIconNameEnum.RefreshCw}
        />
    );
};
