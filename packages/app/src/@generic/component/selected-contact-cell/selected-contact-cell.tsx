import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { useContacts } from '../../hook/use-contacts.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly contactId: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
    readonly emptyDescription: string;
    readonly selectedDescription: string;
    readonly onPress: () => void;
}

export const SelectedContactCell = ({ contactId, testID, variant, emptyDescription, selectedDescription, onPress }: Props) => {
    const { contacts } = useContacts();
    const contact = contacts.find(({ id }) => id === contactId) ?? null;
    const iconVariant: ColorPaletteVariant = isDefined(contact) ? variant : 'secondary';
    const description = isDefined(contact) ? selectedDescription : emptyDescription;

    return (
        <SimpleHorizontalCell
            title={contact?.name ?? ''}
            description={description}
            left={<CircleIcon icon={UserIconNameEnum.User} variant={iconVariant} />}
            onPress={onPress}
            testID={testID}
            {...(isDefined(contact) && { titleTestID: CreateAccountScreenSelector.SelectedContact(contact.name) })}
        />
    );
};
