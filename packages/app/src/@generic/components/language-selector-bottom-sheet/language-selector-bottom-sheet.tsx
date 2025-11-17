import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { LANGUAGES } from '../../constant/languages.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { LanguageInterface } from '../../interface/language.interface';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { SelectorCard } from '../selector-card/selector-card';

interface Props {
    readonly language: LanguageEnum;
    readonly onSelect: (language: LanguageEnum) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints = ['70%'];

export const LanguageSelectorBottomSheet = ({ ref, language, onSelect }: Props) => {
    const [search, setSearch] = useState('');
    const { t, i18n } = useLingui();

    const filteredLanguages = LANGUAGES.filter(
        ({ name, code }) => i18n.t(name).toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (language: LanguageEnum) => {
        onSelect(language);
        ref.current?.close();
    };

    const keyExtractor = (item: LanguageInterface) => item.code;

    const renderItem = ({ item }: { item: LanguageInterface }) => (
        <SelectorCard
            key={item.code}
            isSelected={item.code === language}
            code={item.code}
            emoji={item.emoji}
            name={i18n.t(item.name)}
            onSelect={handleSelect}
        />
    );

    const flatListProps = {
        className: 'pt-3 px-xl',
        contentContainerClassName: 'gap-y-lg'
    };

    return (
        <SearchableListBottomSheet
            index={1}
            ref={ref}
            snapPoints={snapPoints}
            title={t`Select Language`}
            description={t`Choose your preferred language for date and number formatting`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search languages...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`Try a different search term`}
            emptyTitle={t`No languages found`}
            data={filteredLanguages}
            flatListProps={flatListProps}
        />
    );
};
