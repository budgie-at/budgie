import { useLingui } from '@lingui/react/macro';

import { openAppSettings } from '../../utils/open-app-settings.util';
import { Button } from '../button/button';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';

export const ContactSelectorSettingsButton = () => {
    const { t } = useLingui();

    return (
        <Button
            content={t`Open Settings`}
            onPress={openAppSettings}
            variant="cta"
            size="lg"
            className="min-h-[50px] self-stretch mt-xl"
            testID={ContactSelectorSelector.Settings}
        />
    );
};
