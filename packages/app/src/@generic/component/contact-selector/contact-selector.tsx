import { useLingui } from '@lingui/react/macro';
import React, { useRef } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { Contact, useContacts } from '../../hook/use-contacts.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ContactSelectorBottomSheet } from '../contact-selector-bottom-sheet/contact-selector-bottom-sheet';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props {
    readonly contactId: string | null;
    readonly onSelect: (contactId: string) => void;
}

export const ContactSelector = ({ contactId, onSelect }: Props) => {
    const { contacts, error, loadContacts } = useContacts();
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const handleOpen = async () => {
        await loadContacts();

        if (!isNotEmptyString(error)) {
            ref.current?.open();
        }
    };

    const handleSelect = (contact: Contact) => void onSelect(contact.id);
    const icon = isNotEmptyString(error) ? 'RotateCcw' : 'ChevronRight';

    const title = isNotEmptyString(contactId) ? (contacts.find(({ id }) => id === contactId)?.name ?? '') : t`Select a contact`;

    const contact = contacts.find(({ id }) => id === contactId) ?? null;

    return (
        <>
            <HorizontalCell
                right={
                    <View className="p-sm rounded-full">
                        <Icon icon={ICONS[icon]} className="text-primary" size={16} />
                    </View>
                }
                icon="User"
                onPress={handleOpen}
                variant="ghost"
                title={title}
                description={t`Who owes you?`}
            />

            <ContactSelectorBottomSheet selectedContact={contact} contacts={contacts} onSelect={handleSelect} ref={ref} />
        </>
    );
}
