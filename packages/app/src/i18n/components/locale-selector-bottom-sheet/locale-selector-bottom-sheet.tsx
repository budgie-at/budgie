import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { SearchableListBottomSheet } from '../../../@generic/components/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { SelectorCard } from '../../../@generic/components/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LOCALES, LocaleInfoWithDetailsInterface } from '../../constant/locales.constant';

interface Props {
    readonly locale: string;
    readonly onSelect: (locale: string) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints = ['70%'];

const keyExtractor = (item: LocaleInfoWithDetailsInterface) => item.languageTag;

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

export const LocaleSelectorBottomSheet = ({ ref, locale, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { t, i18n } = useLingui();

    const filteredLocales = LOCALES.filter(
        ({ name, languageTag }) =>
            i18n.t(name).toLowerCase().includes(search.toLowerCase()) || languageTag.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (locale: string) => {
        onSelect(locale);
        ref.current?.close();
    };

    const renderItem = ({ item }: { item: LocaleInfoWithDetailsInterface }) => (
        <SelectorCard
            key={item.languageTag}
            isSelected={item.languageTag === locale}
            code={item.languageTag}
            emoji={item.emoji}
            name={i18n.t(item.name)}
            onSelect={handleSelect}
        />
    );

    return (
        <SearchableListBottomSheet
            ref={ref}
            snapPoints={snapPoints}
            title={t`Select Locale`}
            description={t`Choose your preferred locale for date and number formatting`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search locales...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`Try a different search term`}
            emptyTitle={t`No locales found`}
            data={filteredLocales}
            flatListProps={flatListProps}
        />
    );
};
