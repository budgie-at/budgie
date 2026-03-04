import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { ListItemSeparator } from '../@generic/component/list-item-separator/list-item-separator';
import { SelectorCard } from '../@generic/component/selector-card/selector-card';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { LANGUAGES } from '../i18n/constant/languages.constant';
import { useLanguageSelectorModal } from '../i18n/context/language-selector-modal.context';
import { LanguageInterface } from '../i18n/interface/language.interface';

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
    const [, resolveLanguageSelector, currentParams] = useLanguageSelectorModal();
    const { flatListStyle, contentContainerStyle, backgroundColor } = useFormsheetListStyles();
    const [search, setSearch] = useState('');

    const selectedLanguage = currentParams?.selectedLanguage;
    const data = filterLanguages(LANGUAGES, search, t);
    const containerStyle = { flex: 1, backgroundColor };

    const handleSelect = (language: LanguageEnum) => {
        resolveLanguageSelector(language);
    };

    const renderItem = ({ item }: { item: LanguageInterface }) => (
        <SelectorCard<LanguageEnum>
            identifier={item.code}
            isSelected={item.code === selectedLanguage}
            onSelect={handleSelect}
            iconSlot={
                <View className="w-12 h-12 bg-secondary-background rounded-5xl items-center justify-center">
                    <Text className="text-primary text-4xl">{item.emoji}</Text>
                </View>
            }
            title={<Text className="text-primary font-medium text-md">{t(item.name)}</Text>}
            subtitle={<Text className="text-sm text-secondary-foreground">{item.code}</Text>}
        />
    );

    /* jscpd:ignore-start */
    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No languages found`} description={t`Try a different search term`} />
        </View>
    );

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader search={search} onSearchChange={setSearch} placeholder={t`Search languages...`} />

            <FlatList
                style={flatListStyle}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
                ItemSeparatorComponent={ListItemSeparator}
                ListEmptyComponent={listEmptyComponent}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
