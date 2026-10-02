import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { CurrencySelectorModalSelector } from '../../../app/currency-selector-modal.selector';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';
import { EmptyState } from '../empty-state/empty-state';
import { SearchableSelectorList } from '../searchable-selector-list/searchable-selector-list';

const keyExtractor = (item: InstrumentEntityInterface) => String(item.id);

const filterInstruments = (instruments: InstrumentEntityInterface[], search: string): InstrumentEntityInterface[] =>
    instruments.filter(
        ({ name, code, symbol }) =>
            name.toLowerCase().includes(search.toLowerCase()) ||
            code.toLowerCase().includes(search.toLowerCase()) ||
            symbol.toLowerCase().includes(search.toLowerCase())
    );

interface Props {
    readonly instrumentType: InstrumentTypeEnum;
    readonly selectedInstrumentId?: number;
    readonly onSelect: (instrumentId: number) => void;
}

export const CurrencySelectorModalContent = ({ instrumentType, selectedInstrumentId, onSelect }: Props) => {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const data = filterInstruments(instruments, search);
    const emptyStateTitle = instrumentType === InstrumentTypeEnum.CRYPTO ? t`No crypto found` : t`No currencies found`;
    const searchPlaceholder = instrumentType === InstrumentTypeEnum.CRYPTO ? t`Search crypto...` : t`Search currencies...`;

    const handleSelect = (instrumentId: number) => {
        onSelect(instrumentId);
    };

    const renderItem = ({ item }: { item: InstrumentEntityInterface }) => (
        <CurrencySelectorCard
            id={item.id}
            isSelected={item.id === selectedInstrumentId}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            type={item.type}
            onSelect={handleSelect}
        />
    );

    return (
        <SearchableSelectorList
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={searchPlaceholder}
            searchTestID={CurrencySelectorModalSelector.SearchInput}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={<EmptyState title={emptyStateTitle} description={t`Try a different search term`} />}
        />
    );
};
