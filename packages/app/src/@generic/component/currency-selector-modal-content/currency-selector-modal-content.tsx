import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CurrencySelectorModalSelector } from '../../../app/currency-selector-modal.selector';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { groupByInitial } from '../../utils/group-by-initial.util';
import { partitionInstruments } from '../../utils/partition-instruments.util';
import { rankInstrumentSearch } from '../../utils/rank-instrument-search.util';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';
import { SearchableSelectorList } from '../searchable-selector-list/searchable-selector-list';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';
import { SelectorSearchEmptyState } from '../selector-search-empty-state/selector-search-empty-state';

const keyExtractor = (item: InstrumentEntityInterface) => String(item.id);

interface Props {
    readonly instrumentType: InstrumentTypeEnum;
    readonly selectedInstrumentId?: number;
    readonly onSelect: (instrumentId: number) => void;
}

export const CurrencySelectorModalContent = ({ instrumentType, selectedInstrumentId, onSelect }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);

    const isCrypto = instrumentType === InstrumentTypeEnum.CRYPTO;
    const title = isCrypto ? t`Crypto` : t`Currency`;
    const emptyHint = isCrypto ? t`Check the spelling or try a ticker like BTC.` : t`Check the spelling or try a code like EUR.`;
    const searchPlaceholder = isCrypto ? t`Search crypto` : t`Search currencies`;
    const { selected, featured, other } = partitionInstruments(instruments, selectedInstrumentId, instrumentType);
    const otherSections = isCrypto ? groupByInitial(other) : [{ title: t`Other currencies`, data: other }];
    const browseSections = [
        { title: t`Selected`, data: selected },
        { title: isCrypto ? t`Top by market cap` : t`Common`, data: featured },
        ...otherSections
    ];
    const sections = (
        isNotEmptyString(search.trim()) ? [{ title: t`Results`, data: rankInstrumentSearch(instruments, search) }] : browseSections
    ).filter(({ data }) => isNotEmptyArray(data));

    const renderItem = (item: InstrumentEntityInterface) => (
        <CurrencySelectorCard
            id={item.id}
            isSelected={item.id === selectedInstrumentId}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            type={item.type}
            onSelect={onSelect}
            highlight={search.trim()}
        />
    );

    return (
        <SearchableSelectorList
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
            emptyState={<SelectorSearchEmptyState query={search.trim()} hint={emptyHint} />}
        />
    );
};
