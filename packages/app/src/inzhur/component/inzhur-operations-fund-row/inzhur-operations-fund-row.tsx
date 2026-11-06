import { UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

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
    const formatFundQuantity = useFormatFundQuantity();
    const { name, boughtQuantity, boughtAmount, soldQuantity, convertedInQuantity, convertedInAmount, convertedInFrom } = fund;
    const { convertedOutQuantity, convertedOutTo, isConvertedInEstimated } = fund;

    const fundIcon = INZHUR_CANONICAL_FUNDS.find(canonicalFund => canonicalFund.name === name)?.icon ?? UserIconNameEnum.ChartLine;
    const boughtLabel = formatFundQuantity(boughtQuantity);
    const soldLabel = formatFundQuantity(soldQuantity);
    const convertedInLabel = formatFundQuantity(convertedInQuantity);
    const convertedOutLabel = formatFundQuantity(convertedOutQuantity);
    const convertedInSource = isDefined(convertedInFrom) ? getInzhurShortTitle(convertedInFrom) : '';
    const convertedOutTarget = isDefined(convertedOutTo) ? getInzhurShortTitle(convertedOutTo) : '';
    const convertedInSegment = isConvertedInEstimated
        ? t`+${convertedInLabel} from ${convertedInSource} (estimated)`
        : t`+${convertedInLabel} from ${convertedInSource}`;
    const investedAmount = boughtAmount + convertedInAmount;
    const captionSegments = [
        ...(isPositiveNumber(boughtQuantity) ? [t`Bought ${boughtLabel}`] : []),
        ...(isPositiveNumber(soldQuantity) ? [t`Sold ${soldLabel}`] : []),
        ...(isPositiveNumber(convertedInQuantity) ? [convertedInSegment] : []),
        ...(isPositiveNumber(convertedOutQuantity) ? [t`Converted ${convertedOutLabel} → ${convertedOutTarget}`] : [])
    ];

    return (
        <InzhurMoneyRow
            label={getInzhurShortTitle(name)}
            captionSegments={captionSegments}
            amount={investedAmount}
            instrumentSymbol={symbol}
            icon={fundIcon}
        />
    );
};
