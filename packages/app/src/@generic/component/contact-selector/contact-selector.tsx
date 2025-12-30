import { useLingui } from '@lingui/react/macro';
import React, { useRef } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Contact, useContacts } from '../../hook/use-contacts.hook';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { ContactSelectorBottomSheet } from '../contact-selector-bottom-sheet/contact-selector-bottom-sheet';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly contactId: string | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (contactId: string) => void;
}

export const ContactSelector = ({ contactId, onSelect, variant }: Props) => {
    const { contacts, error } = useContacts();
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const handleOpen = async () => {
        if (!isNotEmptyString(error)) {
            ref.current?.open();
        }
    };

    const handleSelect = (contact: Contact) => void onSelect(contact.id);

    const title = isNotEmptyString(contactId) ? (contacts.find(({ id }) => id === contactId)?.name ?? '') : t`Select a contact`;

    const contact = contacts.find(({ id }) => id === contactId) ?? null;
    const iconVariant: ColorPaletteVariant = isDefined(contact) ? variant : 'secondary';

    const description = isDefined(contact) ? t`Owes you` : t`Who owes you?`;
    const iconParams = { variant: iconVariant };

    return (
        <>
            <SimpleHorizontalCell title={title} description={description} icon="User" onPress={handleOpen} iconParams={iconParams} />

            <ContactSelectorBottomSheet selectedContact={contact} contacts={contacts} onSelect={handleSelect} ref={ref} />
        </>
    );
};
