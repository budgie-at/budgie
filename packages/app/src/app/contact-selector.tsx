import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ContactSelectorCard } from '../@generic/component/contact-selector-card/contact-selector-card';
import { EmptyState } from '../@generic/component/empty-state/empty-state';
import { SearchableSelectorList } from '../@generic/component/searchable-selector-list/searchable-selector-list';
import { useContactSelectorModal, useContactSelectorModalParams } from '../@generic/context/contact-selector-modal.context';
import { Contact, useContacts } from '../@generic/hook/use-contacts.hook';

const keyExtractor = (item: Contact) => item.id;

const filterContacts = (contacts: Contact[], search: string): Contact[] =>
    contacts.filter(({ name, emails, phoneNumbers }) => {
        const lowerSearch = search.toLowerCase();
        const someNumber = phoneNumbers?.some(({ number }) => number?.toLowerCase().includes(lowerSearch));
        const someEmail = emails?.some(({ email }) => email?.toLowerCase().includes(lowerSearch));

        return someNumber === true || someEmail === true || (isDefined(name) && name.toLowerCase().includes(lowerSearch));
    });

export default function ContactSelectorModal() {
    const { t } = useLingui();
    const [, resolveContactSelector] = useContactSelectorModal();
    const [search, setSearch] = useState('');
    const { contacts } = useContacts();

    const selectedContactId = useContactSelectorModalParams()?.selectedContactId;
    const data = filterContacts(contacts, search);
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

    return (
        <SearchableSelectorList
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search contacts...`}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={<EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />}
        />
    );
}
