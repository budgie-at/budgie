import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { CountryFlag } from '../@generic/component/country-flag/country-flag';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SearchableSelectorList } from '../@generic/component/searchable-selector-list/searchable-selector-list';
import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { LANGUAGES } from '../i18n/constant/languages.constant';
import { useLanguageSelectorModal, useLanguageSelectorModalParams } from '../i18n/context/language-selector-modal.context';
import { LanguageInterface } from '../i18n/interface/language.interface';

import { LanguageSelectorModalSelector } from './language-selector-modal.selector';

const keyExtractor = (item: LanguageInterface) => item.code;

const filterLanguages = (
    languages: LanguageInterface[],
    search: string,
    translate: (name: LanguageInterface['name']) => string
): LanguageInterface[] =>
    languages.filter(
        ({ name, code }) =>
            translate(name).toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase())
    );

export default function LanguageSelectorModal() {
    const { t } = useLingui();
    const [, resolveLanguageSelector] = useLanguageSelectorModal();
    const currentParams = useLanguageSelectorModalParams();
    const [search, setSearch] = useState('');

    const selectedLanguage = currentParams?.selectedLanguage;
    const data = filterLanguages(LANGUAGES, search, t);

    const handleSelect = (language: LanguageEnum) => {
        resolveLanguageSelector(language);
    };

    const renderItem = ({ item }: { item: LanguageInterface }) => (
        <SelectorCard<LanguageEnum>
            identifier={item.code}
            isSelected={item.code === selectedLanguage}
            onSelect={handleSelect}
            testID={LanguageSelectorModalSelector.Option(item.code)}
            iconSlot={
                <View className="w-12 h-12 bg-secondary-background rounded-5xl items-center justify-center">
                    <CountryFlag language={item.code} size={28} />
                </View>
            }
            title={<Text className="text-primary font-medium text-md">{t(item.name)}</Text>}
            subtitle={<Text className="text-sm text-secondary-foreground">{item.code}</Text>}
        />
    );

    return (
        <SearchableSelectorList
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search languages...`}
            searchTestID={LanguageSelectorModalSelector.SearchInput}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={<EmptyState title={t`No languages found`} description={t`Try a different search term`} />}
        />
    );
}
