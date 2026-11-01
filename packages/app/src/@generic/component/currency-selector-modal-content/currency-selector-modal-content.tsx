import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CurrencySelectorModalSelector } from '../../../app/currency-selector-modal.selector';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { CurrencySelectorCard } from '../currency-selector-card/currency-selector-card';
import { EmptyState } from '../empty-state/empty-state';
import { SearchableSelectorList } from '../searchable-selector-list/searchable-selector-list';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';

const POPULAR_COUNT = 8;

const compareByName = (first: InstrumentEntityInterface, second: InstrumentEntityInterface) => first.name.localeCompare(second.name);

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
    const title = instrumentType === InstrumentTypeEnum.CRYPTO ? t`Crypto` : t`Currency`;
    const otherTitle = instrumentType === InstrumentTypeEnum.CRYPTO ? t`Other crypto` : t`Other currencies`;
    const selectedInstrument = data.find(({ id }) => id === selectedInstrumentId);
    const popular = [selectedInstrument, ...data.filter(({ id }) => id !== selectedInstrumentId)].filter(isDefined).slice(0, POPULAR_COUNT);
    const popularIds = new Set(popular.map(({ id }) => id));
    const remainingInstruments = data.filter(({ id }) => !popularIds.has(id));
    const otherInstruments =
        instrumentType === InstrumentTypeEnum.CRYPTO ? remainingInstruments : [...remainingInstruments].sort(compareByName);
    const sections = isNotEmptyString(search.trim())
        ? [{ title: null, data }]
        : [
              { title: t`Popular`, data: popular },
              { title: otherTitle, data: otherInstruments }
          ];

    const renderItem = (item: InstrumentEntityInterface) => (
        <CurrencySelectorCard
            id={item.id}
            isSelected={item.id === selectedInstrumentId}
            code={item.code}
            symbol={item.symbol}
            name={item.name}
            type={item.type}
            onSelect={onSelect}
        />
    );

    return (
        <SearchableSelectorList
            header={
                <SelectorModalSearchHeader
                    title={title}
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search`}
                    testID={CurrencySelectorModalSelector.SearchInput}
                />
            }
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={<EmptyState title={emptyStateTitle} description={t`Try a different search term`} />}
        />
    );
};
