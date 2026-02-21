import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { CurrencySelectorCard } from '../@generic/component/currency-selector-card/currency-selector-card';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { FormSheetSpacer } from '../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useCurrencySelectorModal } from '../@generic/context/currency-selector-modal.context';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useGetInstrumentsByTypeQuery } from '../instrument/query/use-get-instruments-by-type.query';

const keyExtractor = (item: InstrumentEntityInterface) => item.code;

const filterInstruments = (instruments: InstrumentEntityInterface[], search: string): InstrumentEntityInterface[] =>
    instruments.filter(
        ({ name, code }) => name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    );

export default function CurrencySelectorModal() {
    const { t } = useLingui();
    const { currentParams, resolveCurrencySelector } = useCurrencySelectorModal();
    const { flatListStyle, contentContainerStyle, backgroundColor } = useFormsheetListStyles();
    const [search, setSearch] = useState('');
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);

    const selectedInstrumentId = currentParams?.selectedInstrumentId;
    const data = filterInstruments(instruments, search);
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelect = (instrumentId: number) => {
        resolveCurrencySelector(instrumentId);
    };

    const renderItem = ({ item }: { item: InstrumentEntityInterface }) => (
        <CurrencySelectorCard
            id={item.id}
            isSelected={item.id === selectedInstrumentId}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            onSelect={handleSelect}
        />
    );

    /* jscpd:ignore-start */
    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No currencies found`} description={t`Try a different search term`} />
        </View>
    );

    const listFooterComponent = <FormSheetSpacer />;

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader search={search} onSearchChange={setSearch} placeholder={t`Search currencies...`} />

            <FlatList
                style={flatListStyle}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-xl gap-y-lg"
                contentContainerStyle={contentContainerStyle}
                ListEmptyComponent={listEmptyComponent}
                ListFooterComponent={listFooterComponent}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
