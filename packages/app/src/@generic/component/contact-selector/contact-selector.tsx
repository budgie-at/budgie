import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useOpenModal } from '../../hook/use-open-modal/use-open-modal.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { SelectedContactCell } from '../selected-contact-cell/selected-contact-cell';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly contactId: string | null;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
    readonly emptyDescription: string;
    readonly selectedDescription: string;
    readonly onSelect: (contactId: string) => void;
}

export const ContactSelector = ({ contactId, onSelect, testID, variant, emptyDescription, selectedDescription }: Props) => {
    const openContactSelector = useOpenModal('/contact-selector');
    const { t } = useLingui();

    const handleOpen = () => {
        openContactSelector({ selectedContactId: contactId }, selectedContact => {
            if (isDefined(selectedContact)) {
                onSelect(selectedContact.id);
            }
        });
    };

    if (isDefined(contactId)) {
        return (
            <SelectedContactCell
                contactId={contactId}
                testID={testID}
                variant={variant}
                emptyDescription={emptyDescription}
                selectedDescription={selectedDescription}
                onPress={handleOpen}
            />
        );
    }

    return (
        <SimpleHorizontalCell
            title={t`Select a contact`}
            description={emptyDescription}
            left={<CircleIcon icon={UserIconNameEnum.User} variant="secondary" />}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
