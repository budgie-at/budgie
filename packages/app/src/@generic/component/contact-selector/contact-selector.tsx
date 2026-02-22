import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useContactSelectorModal } from '../../context/contact-selector-modal.context';
import { useContacts } from '../../hook/use-contacts.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly contactId: string | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (contactId: string) => void;
}

export const ContactSelector = ({ contactId, onSelect, variant }: Props) => {
    const { contacts, error } = useContacts();
    const [openContactSelector] = useContactSelectorModal();
    const { t } = useLingui();

    const handleOpen = async () => {
        if (!isNotEmptyString(error)) {
            const result = await openContactSelector({ selectedContactId: contactId });

            if (isDefined(result)) {
                onSelect(result.id);
            }
        }
    };

    const title = isNotEmptyString(contactId) ? (contacts.find(({ id }) => id === contactId)?.name ?? '') : t`Select a contact`;

    const contact = contacts.find(({ id }) => id === contactId) ?? null;
    const iconVariant: ColorPaletteVariant = isDefined(contact) ? variant : 'secondary';
    const description = isDefined(contact) ? t`Owes you` : t`Who owes you?`;

    return (
        <SimpleHorizontalCell
            title={title}
            description={description}
            left={<CircleIcon icon={UserIconNameEnum.User} variant={iconVariant} />}
            onPress={handleOpen}
        />
    );
};
