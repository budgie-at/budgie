import { ContactWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { Contact } from '../../hook/use-contacts.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { ContactSelectorCard } from '../contact-selector-card/contact-selector-card';

interface Props {
    readonly emptyStateDescription?: string;
    readonly onSelect: (contact: Contact) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedContact: Contact | null;
    readonly contacts: Contact[];
}

const keyExtractor = (item: ContactWithInstrumentEntityInterface) => item.id.toString();

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

export const ContactSelectorBottomSheet = ({ ref, contacts, selectedContact, onSelect, emptyStateDescription }: Props) => {
    const [search, setSearch] = useState('');
    const { t } = useLingui();

    const handleSelect = (contact: Contact) => {
        void ref.current?.dismiss();
        onSelect(contact);
    };

    const renderItem = ({ item }: { item: Contact }) => {
        const onSelect = () => void handleSelect(item);

        return (
            <ContactSelectorCard
                image={item.image?.uri ?? null}
                isSelected={item.id === selectedContact?.id}
                emails={item.emails?.map(item => item.email).filter(isNotEmptyString) ?? []}
                phoneNumbers={item.phoneNumbers?.map(item => item.number).filter(isNotEmptyString) ?? []}
                onSelect={onSelect}
                title={item.name}
                key={item.id}
                id={item.id}
            />
        );
    };

    const getEmptyStateDescription = () => {
        if (isNotEmptyString(search)) {
            return t`Try a different search term`;
        }

        return emptyStateDescription ?? t`Create one to get started.`;
    };

    const emptyIcon = isNotEmptyString(search) ? 'Search' : 'User';

    const emptyTitle = isNotEmptyString(search) ? t`No contacts found` : t`No contacts yet`;

    const emptyDescription = getEmptyStateDescription();

    const filteredContacts = contacts.filter(({ name, emails, phoneNumbers }) => {
        const someNumber = phoneNumbers?.some(({ number }) => number?.toLowerCase().includes(search.toLowerCase()));
        const someEmail = emails?.some(({ email }) => email?.toLowerCase().includes(search.toLowerCase()));

        return someNumber || someEmail || name.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <SearchableListBottomSheet
            ref={ref}
            emptyIcon={emptyIcon}
            title={t`Select Contact`}
            description={t`Choose your main contact`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search contacts...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            data={filteredContacts}
            flatListProps={flatListProps}
        />
    );
};
