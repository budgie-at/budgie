import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { SelectorRowTitle } from '../../../@generic/component/selector-row-title/selector-row-title';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { YahooListingInterface } from '@budgie/market';

interface Props {
    readonly listing: YahooListingInterface;
    readonly isSelected: boolean;
    readonly onSelect: (listing: YahooListingInterface) => void;
    readonly highlight: string;
}

export const SecurityListingRow = ({ listing, isSelected, onSelect, highlight }: Props) => {
    const handlePress = () => void onSelect(listing);

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handlePress}
            testID={BrokerageSelector.Listing(listing.symbol)}
            left={<CurrencySelectorInstrumentIcon code={listing.symbol} symbol={listing.symbol} type={listing.type} size={36} />}
            title={<SelectorRowTitle text={listing.name} highlight={highlight} isSelected={isSelected} />}
            subtitle={
                <SelectorRowTitle
                    text={joinWithMiddot([listing.symbol, listing.exchange])}
                    highlight={highlight}
                    className="text-secondary-foreground text-[13px] leading-[18px]"
                />
            }
        />
    );
};
