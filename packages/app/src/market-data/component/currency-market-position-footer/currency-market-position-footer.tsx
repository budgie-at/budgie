import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly costBasis: number | null;
    readonly valuationRate: number | null;
}

export const CurrencyMarketPositionFooter = ({ costBasis, valuationRate }: Props) => {
    if (isDefined(valuationRate) && isDefined(costBasis)) {
        return null;
    }

    return (
        <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
            {isDefined(valuationRate) ? (
                <Trans>No purchase price is recorded for this balance, so the return can’t be calculated.</Trans>
            ) : (
                <Trans>No market price yet, so value and return can’t be calculated.</Trans>
            )}
        </Text>
    );
};
