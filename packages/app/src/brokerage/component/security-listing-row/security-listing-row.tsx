import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { YahooListingInterface } from '@budgie/market';

interface Props {
    readonly listing: YahooListingInterface;
    readonly isSelected: boolean;
    readonly onSelect: (listing: YahooListingInterface) => void;
}

export const SecurityListingRow = ({ listing, isSelected, onSelect }: Props) => {
    const handlePress = () => void onSelect(listing);

    return (
        <GroupedListCheckRow
            title={listing.name}
            subtitle={joinWithMiddot([listing.symbol, listing.exchange])}
            isSelected={isSelected}
            onPress={handlePress}
            testID={BrokerageSelector.Listing(listing.symbol)}
        />
    );
};
