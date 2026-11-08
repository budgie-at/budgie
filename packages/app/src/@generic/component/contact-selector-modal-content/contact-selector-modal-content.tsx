import { useState } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../constant/morphing-sheet-height-ratio.constant';
import { Contact, useContacts } from '../../hook/use-contacts.hook';
import { useMorphingSheetCommit } from '../../hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../hook/use-morphing-sheet-list-height.hook';
import { ContactSelectorCard } from '../contact-selector-card/contact-selector-card';
import { ContactSelectorEmpty } from '../contact-selector-empty/contact-selector-empty';
import { ContactSelectorHeader } from '../contact-selector-header/contact-selector-header';
import { SearchableSelectorList } from '../searchable-selector-list/searchable-selector-list';

const keyExtractor = (item: Contact) => item.id;

const filterContacts = (contacts: Contact[], search: string): Contact[] =>
    contacts.filter(({ name, emails, phoneNumbers }) => {
        const lowerSearch = search.toLowerCase();
        const someNumber = phoneNumbers?.some(({ number }) => number?.toLowerCase().includes(lowerSearch));
        const someEmail = emails?.some(({ email }) => email?.toLowerCase().includes(lowerSearch));

        return someNumber === true || someEmail === true || (isDefined(name) && name.toLowerCase().includes(lowerSearch));
    });

interface Props {
    readonly selectedContactId?: string | null;
    readonly onCommit: (contact: Contact) => void;
}

export const ContactSelectorModalContent = ({ selectedContactId, onCommit }: Props) => {
    const [search, setSearch] = useState('');
    const listStyle = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const { contacts, isLoading, isInitial, isFailure, isDenied, isLimited, retry } = useContacts();

    const sections = [{ title: null, data: filterContacts(contacts, search) }];
    const hasContacts = isNotEmptyArray(contacts);
    const isSearching = hasContacts && isNotEmptyString(search);
    const hasLimitedContacts = isLimited && hasContacts;
    const renderItem = (item: Contact) => {
        const handleSelect = () => void commit(item);

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
        <View style={listStyle}>
            <SearchableSelectorList
                className="pt-lg"
                query={search.trim()}
                header={
                    <ContactSelectorHeader
                        search={search}
                        onSearchChange={setSearch}
                        isLimited={hasLimitedContacts}
                        canSearch={hasContacts}
                    />
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
        </View>
    );
};
