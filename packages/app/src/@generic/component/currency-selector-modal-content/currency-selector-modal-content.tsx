import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CurrencySelectorModalSelector } from '../../../app/currency-selector-modal.selector';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../hook/use-morphing-sheet-list-height.hook';
import { groupByInitial } from '../../utils/group-by-initial.util';
import { partitionInstruments } from '../../utils/partition-instruments.util';
import { rankInstrumentSearch } from '../../utils/rank-instrument-search.util';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';
import { EmptyState } from '../empty-state/empty-state';
import { LoadingContent } from '../loading-content/loading-content';
import { SearchableSelectorList } from '../searchable-selector-list/searchable-selector-list';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';
import { SelectorSearchEmptyState } from '../selector-search-empty-state/selector-search-empty-state';

const keyExtractor = (item: InstrumentEntityInterface) => String(item.id);

interface Props {
    readonly instrumentType: InstrumentTypeEnum;
    readonly selectedInstrumentId?: number;
    readonly onCommit: (instrumentId: number) => void;
}

export const CurrencySelectorModalContent = ({ instrumentType, selectedInstrumentId, onCommit }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const { instruments, isLoading } = useGetInstrumentsByTypeQuery(instrumentType);

    const query = search.trim();
    const isCrypto = instrumentType === InstrumentTypeEnum.CRYPTO;
    const title = isCrypto ? t`Crypto` : t`Currency`;
    const emptyHint = isCrypto ? t`Check the spelling or try a ticker like BTC.` : t`Check the spelling or try a code like EUR.`;
    const searchPlaceholder = isCrypto ? t`Search crypto` : t`Search currencies`;
    const toBrowseSections = () => {
        const { selected, featured, other } = partitionInstruments(instruments, selectedInstrumentId, instrumentType);
        const otherSections = isCrypto ? groupByInitial(other) : [{ title: t`Other currencies`, data: other }];

        return [
            { title: t`Selected`, data: selected },
            { title: isCrypto ? t`Top by market cap` : t`Common`, data: featured },
            ...otherSections
        ];
    };
    const sections = (
        isNotEmptyString(query) ? [{ title: t`Results`, data: rankInstrumentSearch(instruments, query) }] : toBrowseSections()
    ).filter(({ data }) => isNotEmptyArray(data));

    const renderItem = (item: InstrumentEntityInterface) => (
        <CurrencySelectorCard instrument={item} isSelected={item.id === selectedInstrumentId} onSelect={commit} highlight={query} />
    );

    const emptyState = isNotEmptyString(query) ? (
        <SelectorSearchEmptyState query={query} hint={emptyHint} />
    ) : (
        <EmptyState title={title} description="" />
    );

    return (
        <View style={listStyle}>
            <SearchableSelectorList
                className="pt-lg"
                query={query}
                header={
                    <SelectorModalSearchHeader
                        title={title}
                        search={search}
                        onSearchChange={setSearch}
                        placeholder={searchPlaceholder}
                        testID={CurrencySelectorModalSelector.SearchInput}
                    />
                }
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                emptyState={<LoadingContent isLoading={isLoading}>{emptyState}</LoadingContent>}
            />
        </View>
    );
};
