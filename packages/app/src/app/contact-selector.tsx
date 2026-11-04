import { useState } from 'react';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ContactSelectorCard } from '../@generic/component/contact-selector-card/contact-selector-card';
import { ContactSelectorEmpty } from '../@generic/component/contact-selector-empty/contact-selector-empty';
import { ContactSelectorHeader } from '../@generic/component/contact-selector-header/contact-selector-header';
import { SearchableSelectorList } from '../@generic/component/searchable-selector-list/searchable-selector-list';
import { useContactSelectorModal, useContactSelectorModalParams } from '../@generic/context/contact-selector-modal.context';
import { Contact, useContacts } from '../@generic/hook/use-contacts.hook';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';

const keyExtractor = (item: Contact) => item.id;

const filterContacts = (contacts: Contact[], search: string): Contact[] =>
    contacts.filter(({ name, emails, phoneNumbers }) => {
        const lowerSearch = search.toLowerCase();
        const someNumber = phoneNumbers?.some(({ number }) => number?.toLowerCase().includes(lowerSearch));
        const someEmail = emails?.some(({ email }) => email?.toLowerCase().includes(lowerSearch));

        return someNumber === true || someEmail === true || (isDefined(name) && name.toLowerCase().includes(lowerSearch));
    });

export default function ContactSelectorModal() {
    const [, resolveContactSelector, dismissContactSelector] = useContactSelectorModal();
    useModalDismiss(dismissContactSelector);
    const [search, setSearch] = useState('');
    const { contacts, isLoading, isInitial, isFailure, isDenied, isLimited, retry } = useContacts();

    const selectedContactId = useContactSelectorModalParams()?.selectedContactId;
    const sections = [{ title: null, data: filterContacts(contacts, search) }];
    const isSearching = isNotEmptyString(search);
    const hasContacts = isNotEmptyArray(contacts);
    const hasLimitedContacts = isLimited && hasContacts;
    const renderItem = (item: Contact) => {
        const handleSelect = () => void resolveContactSelector(item);

        return (
            <ContactSelectorCard
                image={item.image?.uri ?? null}
                isSelected={item.id === selectedContactId}
                emails={item.emails?.map(entry => entry.email).filter(isNotEmptyString) ?? []}
                phoneNumbers={item.phoneNumbers?.map(entry => entry.number).filter(isNotEmptyString) ?? []}
                onSelect={handleSelect}
                title={item.name}
            />
        );
    };

    return (
        <SearchableSelectorList
            query={search.trim()}
            header={
                <ContactSelectorHeader search={search} onSearchChange={setSearch} isLimited={hasLimitedContacts} canSearch={hasContacts} />
            }
            sections={sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyState={
                <ContactSelectorEmpty
                    isLoading={isLoading}
                    isInitial={isInitial}
                    isFailure={isFailure}
                    isDenied={isDenied}
                    isLimited={isLimited}
                    isSearching={isSearching}
                    onRetry={retry}
                />
            }
        />
    );
}
