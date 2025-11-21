import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { SearchableListBottomSheet } from '../../../@generic/components/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { SelectorCard } from '../../../@generic/components/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LANGUAGES } from '../../constant/languages.constant';
import { LanguageInterface } from '../../interface/language.interface';

interface Props {
    readonly language: LanguageEnum;
    readonly onSelect: (language: LanguageEnum) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const keyExtractor = (item: LanguageInterface) => item.code;

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

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

    return (
        <SearchableListBottomSheet
            index={1}
            ref={ref}
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
