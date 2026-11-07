import { UserIconNameEnum } from '@budgie/contracts';
import { INZHUR_CANONICAL_FUNDS } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
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
    const isAmountProtected = useIsAmountProtected();
    const {
        name,
        boughtQuantity,
        boughtAmount,
        soldQuantity,
        convertedInQuantity,
        convertedInAmount,
        convertedInFrom,
        convertedOutQuantity,
        convertedOutTo,
        isConvertedInEstimated
    } = fund;

    const fundIcon = INZHUR_CANONICAL_FUNDS.find(canonicalFund => canonicalFund.name === name)?.icon ?? UserIconNameEnum.ChartLine;
    const boughtLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(boughtQuantity);
    const soldLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(soldQuantity);
    const convertedInLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(convertedInQuantity);
    const convertedOutLabel = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(convertedOutQuantity);
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
