import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BrokerageSelector } from '../../selector/brokerage.selector';

interface Props {
    readonly missingRateCurrency: string | null;
    readonly currencySymbol: string;
}

export const SecurityTradePriceHint = ({ missingRateCurrency, currencySymbol }: Props) =>
    isDefined(missingRateCurrency) ? (
        <Text className="px-3xl pt-md text-[13px] leading-[18px] text-secondary-foreground" testID={BrokerageSelector.PriceHint}>
            <Trans>
                Quoted in {missingRateCurrency} with no exchange rate yet. Enter the price in {currencySymbol}.
            </Trans>
        </Text>
    ) : null;
