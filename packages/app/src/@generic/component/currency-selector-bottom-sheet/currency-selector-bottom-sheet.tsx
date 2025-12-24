import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';

interface Props {
    readonly selectedInstrumentId?: number;
    readonly onSelect: (instrumentId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const keyExtractor = (item: InstrumentEntityInterface) => item.code;

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

export const CurrencySelectorBottomSheet = ({ ref, selectedInstrumentId, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);
    const { t } = useLingui();

    const filteredCurrencies = instruments.filter(
        ({ name, code }) => name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (instrumentId: number) => {
        onSelect(instrumentId);
        ref.current?.close();
    };

    const renderItem = ({ item }: { item: InstrumentEntityInterface }) => (
        <CurrencySelectorCard
            key={item.code}
            id={item.id}
            isSelected={item.id === selectedInstrumentId}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            onSelect={handleSelect}
        />
    );

    return (
        <SearchableListBottomSheet
            ref={ref}
            title={t`Select Currency`}
            description={t`Choose your main currency`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search currencies...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`Try a different search term`}
            emptyTitle={t`No currencies found`}
            data={filteredCurrencies}
            flatListProps={flatListProps}
        />
    );
};
