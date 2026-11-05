import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ContactSelectorSettingsButton } from '../contact-selector-settings-button/contact-selector-settings-button';
import { ContactSelectorState } from '../contact-selector-state/contact-selector-state';

interface Props {
    readonly isLoading: boolean;
    readonly isInitial: boolean;
    readonly isFailure: boolean;
    readonly isDenied: boolean;
    readonly isLimited: boolean;
    readonly isSearching: boolean;
    readonly onRetry: () => void;
}

export const ContactSelectorEmpty = (props: Props) => {
    const { isLoading, isInitial, isFailure, isDenied, isLimited, isSearching, onRetry } = props;
    const { t } = useLingui();

    if (isFailure) {
        return (
            <ContactSelectorState
                isLoading={isLoading}
                title={t`Could not load contacts`}
                description={t`Try loading your contacts again.`}
                icon={UserIconNameEnum.UserX}
                onRetry={onRetry}
            />
        );
    }
    if (isInitial) {
        return (
            <ContactSelectorState
                isLoading
                title={t`Loading contacts`}
                description={t`Your contacts will appear here.`}
                icon={UserIconNameEnum.User}
            />
        );
    }
    if (isDenied) {
        return (
            <ContactSelectorState
                isLoading={isLoading}
                title={t`Contacts access is off`}
                description={t`Allow contacts access in Settings.`}
                icon={UserIconNameEnum.Lock}
            >
                <ContactSelectorSettingsButton />
            </ContactSelectorState>
        );
    }
    if (isSearching) {
        return (
            <ContactSelectorState
                isLoading={isLoading}
                title={t`No matching contacts`}
                description={t`Try another name, phone number or email.`}
                icon={UserIconNameEnum.Search}
            />
        );
    }

    const title = isLimited ? t`No shared contacts` : t`No contacts on this device`;
    const description = isLimited ? t`Choose contacts to share in Settings.` : t`Add a person in Contacts, then return here.`;

    const settingsAction = isLimited ? <ContactSelectorSettingsButton /> : null;

    return (
        <ContactSelectorState isLoading={isLoading} title={title} description={description} icon={UserIconNameEnum.User}>
            {settingsAction}
        </ContactSelectorState>
    );
};
