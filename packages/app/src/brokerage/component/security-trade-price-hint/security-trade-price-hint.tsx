import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BrokerageSelector } from '../../selector/brokerage.selector';

interface Props {
    readonly missingRateCurrency: string | null;
    readonly isUnavailable: boolean;
    readonly currencySymbol: string;
}

export const SecurityTradePriceHint = ({ missingRateCurrency, isUnavailable, currencySymbol }: Props) => {
    if (!isDefined(missingRateCurrency) && !isUnavailable) {
        return null;
    }

    return (
        <Text className="px-3xl pt-md text-[13px] leading-[18px] text-secondary-foreground" testID={BrokerageSelector.PriceHint}>
            {isDefined(missingRateCurrency) ? (
                <Trans>
                    Quoted in {missingRateCurrency} with no exchange rate yet. Enter the price in {currencySymbol}.
                </Trans>
            ) : (
                <Trans>No current price for this security. Enter the price per share.</Trans>
            )}
        </Text>
    );
};
