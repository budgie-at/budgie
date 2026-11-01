import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { CountryFlag } from '../@generic/component/country-flag/country-flag';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SearchableSelectorList } from '../@generic/component/searchable-selector-list/searchable-selector-list';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { SelectorRow } from '../@generic/component/selector-row/selector-row';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
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
    languages.filter(({ name, nativeName, code }) =>
        [translate(name), translate(nativeName), code].some(value => value.toLowerCase().includes(search.toLowerCase()))
    );

export default function LanguageSelectorModal() {
    const { t } = useLingui();
    const [, resolveLanguageSelector, dismissLanguageSelector] = useLanguageSelectorModal();
    useModalDismiss(dismissLanguageSelector);
    const currentParams = useLanguageSelectorModalParams();
    const [search, setSearch] = useState('');

    const selectedLanguage = currentParams?.selectedLanguage;
    const sections = [{ title: null, data: filterLanguages(LANGUAGES, search, t) }];

    const renderItem = (item: LanguageInterface) => {
        const isSelected = item.code === selectedLanguage;
        const handleSelect = isSelected ? emptyFn : () => void resolveLanguageSelector(item.code);

        const title = t(item.nativeName);
        const translatedName = t(item.name);
        const subtitle = title === translatedName ? null : translatedName;

        return (
            <SelectorRow
                isSelected={isSelected}
                onPress={handleSelect}
                testID={LanguageSelectorModalSelector.Option(item.code)}
                left={
                    <View className="h-[36px] w-[36px] items-center justify-center overflow-hidden rounded-full border-hairline border-primary/25">
                        <CountryFlag language={item.code} size={54} />
                    </View>
                }
                title={title}
                subtitle={subtitle}
            />
        );
    };

    return (
        <SearchableSelectorList
            header={
                <SelectorModalSearchHeader
                    title={t`Language`}
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search`}
                    testID={LanguageSelectorModalSelector.SearchInput}
                />
            }
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={<EmptyState title={t`No languages found`} description={t`Try a different search term`} />}
        />
    );
}
