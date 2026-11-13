import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SearchInput } from '../../../@generic/component/search-input/search-input';
import { useSecuritySearchQuery } from '../../query/use-security-search.query';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { SecurityListingRow } from '../security-listing-row/security-listing-row';

import type { YahooListingInterface } from '@budgie/market';

interface Props {
    readonly query: string;
    readonly onQueryChange: (query: string) => void;
    readonly selectedSymbol: string | null;
    readonly onSelect: (listing: YahooListingInterface) => void;
}

export const SecuritySearchSection = ({ query, onQueryChange, selectedSymbol, onSelect }: Props) => {
    const { t } = useLingui();
    const listings = useSecuritySearchQuery(query);

    return (
        <View className="gap-y-lg">
            <SearchInput
                value={query}
                onChangeText={onQueryChange}
                placeholder={t`Ticker, ISIN or name`}
                autoCapitalize="characters"
                testID={BrokerageSelector.SearchInput}
            />
            {isNotEmptyArray(listings) ? (
                <GroupedListSection>
                    {listings.map(listing => (
                        <SecurityListingRow
                            key={listing.symbol}
                            listing={listing}
                            isSelected={listing.symbol === selectedSymbol}
                            onSelect={onSelect}
                        />
                    ))}
                </GroupedListSection>
            ) : null}
        </View>
    );
};
