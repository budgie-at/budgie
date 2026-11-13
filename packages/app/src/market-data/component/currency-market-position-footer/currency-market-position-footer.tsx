import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';

interface Props {
    readonly costBasis: number | null;
    readonly valuationRate: number | null;
}

export const CurrencyMarketPositionFooter = ({ costBasis, valuationRate }: Props) => {
    if (isDefined(valuationRate) && isDefined(costBasis)) {
        return null;
    }

    return (
        <Text
            className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]"
            numberOfLines={4}
            maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
        >
            {isDefined(valuationRate) ? (
                <Trans>No purchase price recorded, so return is unavailable.</Trans>
            ) : (
                <Trans>No market price yet, so value and return are unavailable.</Trans>
            )}
        </Text>
    );
};
