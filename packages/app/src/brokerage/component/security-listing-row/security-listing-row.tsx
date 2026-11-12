import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { YahooListingInterface } from '@budgie/market';

interface Props {
    readonly listing: YahooListingInterface;
    readonly isSelected: boolean;
    readonly onSelect: (listing: YahooListingInterface) => void;
}

export const SecurityListingRow = ({ listing, isSelected, onSelect }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    const handlePress = () => void onSelect(listing);

    const parts = [listing.symbol, listing.exchange];
    const subtitle = isStacked ? parts.filter(isNotEmptyString).join('\n') : joinWithMiddot(parts);

    return (
        <GroupedListCheckRow
            title={listing.name}
            titleNumberOfLines={0}
            subtitle={subtitle}
            isSelected={isSelected}
            onPress={handlePress}
            testID={BrokerageSelector.Listing(listing.symbol)}
        />
    );
};
