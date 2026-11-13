import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { SearchableSelectorList } from '../../../@generic/component/searchable-selector-list/searchable-selector-list';
import { SelectorModalSearchHeader } from '../../../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorSearchEmptyState } from '../../../@generic/component/selector-search-empty-state/selector-search-empty-state';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
import { useSecuritySearchQuery } from '../../query/use-security-search.query';
import { BrokerageSelector } from '../../selector/brokerage.selector';
import { SecurityListingRow } from '../security-listing-row/security-listing-row';

import type { YahooListingInterface } from '@budgie/market';

const keyExtractor = (listing: YahooListingInterface) => listing.symbol;

interface Props {
    readonly selectedSymbol: string | null;
    readonly onCommit: (listing: YahooListingInterface) => void;
}

export const SecuritySelectorModalContent = ({ selectedSymbol, onCommit }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const { listings, isLoading } = useSecuritySearchQuery(search);

    const query = search.trim();
    const sections = [{ title: null, data: listings }];
    const renderItem = (listing: YahooListingInterface) => (
        <SecurityListingRow listing={listing} isSelected={listing.symbol === selectedSymbol} onSelect={commit} highlight={query} />
    );
    const emptyState = isNotEmptyString(query) ? (
        <LoadingContent isLoading={isLoading}>
            <SelectorSearchEmptyState query={query} hint={t`Check the spelling or try a ticker like AAPL.`} />
        </LoadingContent>
    ) : (
        <EmptyState title={t`Find a stock or ETF`} description={t`Search by ticker, ISIN or company name.`} />
    );

    return (
        <View style={listStyle}>
            <SearchableSelectorList
                className="pt-lg"
                query={query}
                header={
                    <SelectorModalSearchHeader
                        title={t`Choose security`}
                        search={search}
                        onSearchChange={setSearch}
                        placeholder={t`Ticker, ISIN or name`}
                        testID={BrokerageSelector.SearchInput}
                        trailing={<View />}
                        isAutoFocused
                    />
                }
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                emptyState={emptyState}
            />
        </View>
    );
};
