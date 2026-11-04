import { useLingui } from '@lingui/react/macro';

import { openContactsSettings } from '../../utils/open-contacts-settings.util';
import { Button } from '../button/button';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';

export const ContactSelectorSettingsButton = () => {
    const { t } = useLingui();

    return (
        <Button
            content={t`Open Settings`}
            onPress={openContactsSettings}
            variant="cta"
            size="lg"
            className="min-h-[50px] self-stretch mt-xl"
            testID={ContactSelectorSelector.Settings}
        />
    );
};
