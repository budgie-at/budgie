import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ContactSelectorCard } from '../@generic/component/contact-selector-card/contact-selector-card';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { FormSheetSpacer } from '../@generic/component/form-sheet-spacer/form-sheet-spacer';
import { ListItemSeparator } from '../@generic/component/list-item-separator/list-item-separator';
import { SelectorModalSearchHeader } from '../@generic/component/selector-modal-search-header/selector-modal-search-header';
import { useContactSelectorModal } from '../@generic/context/contact-selector-modal.context';
import { Contact, useContacts } from '../@generic/hook/use-contacts.hook';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';

const keyExtractor = (item: Contact) => item.id;

const listFooterComponent = <FormSheetSpacer />;

const filterContacts = (contacts: Contact[], search: string): Contact[] =>
    contacts.filter(({ name, emails, phoneNumbers }) => {
        const lowerSearch = search.toLowerCase();
        const someNumber = phoneNumbers?.some(({ number }) => number?.toLowerCase().includes(lowerSearch));
        const someEmail = emails?.some(({ email }) => email?.toLowerCase().includes(lowerSearch));

        return someNumber === true || someEmail === true || (isDefined(name) && name.toLowerCase().includes(lowerSearch));
    });

export default function ContactSelectorModal() {
    const { t } = useLingui();
    const [, resolveContactSelector, currentParams] = useContactSelectorModal();
    const { flatListStyle, contentContainerStyle, backgroundColor } = useFormsheetListStyles();
    const [search, setSearch] = useState('');
    const { contacts } = useContacts();

    const selectedContactId = currentParams?.selectedContactId;
    const data = filterContacts(contacts, search);
    const containerStyle = { flex: 1, backgroundColor };
    const isSearching = isNotEmptyString(search);
    const emptyIcon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.User;
    const emptyTitle = isSearching ? t`No contacts found` : t`No contacts yet`;
    const emptyDescription = isSearching ? t`Try a different search term` : t`Create one to get started.`;

    const renderItem = ({ item }: { item: Contact }) => {
        const handleSelect = () => void resolveContactSelector(item);

        return (
            <ContactSelectorCard
                image={item.image?.uri ?? null}
                isSelected={item.id === selectedContactId}
                emails={item.emails?.map(entry => entry.email).filter(isNotEmptyString) ?? []}
                phoneNumbers={item.phoneNumbers?.map(entry => entry.number).filter(isNotEmptyString) ?? []}
                onSelect={handleSelect}
                title={item.name}
                id={item.id}
            />
        );
    };

    /* jscpd:ignore-start */
    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        </View>
    );

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader search={search} onSearchChange={setSearch} placeholder={t`Search contacts...`} />

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
                ListFooterComponent={listFooterComponent}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
