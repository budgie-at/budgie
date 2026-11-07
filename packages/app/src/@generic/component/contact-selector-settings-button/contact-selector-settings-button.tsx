import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { openContactsSettings } from '../../utils/open-contacts-settings.util';
import { Button } from '../button/button';
import { ContactSelectorSelector } from '../contact-selector/contact-selector.selector';

export const ContactSelectorSettingsButton = () => {
    const { t } = useLingui();

    return (
        <Button
            accessibilityLabel={t`Open Settings`}
            content={
                <Text maxFontSizeMultiplier={MAX_CHROME_FONT_SIZE_MULTIPLIER} className="text-[17px] font-semibold text-center">
                    {t`Open Settings`}
                </Text>
            }
            onPress={openContactsSettings}
            variant="cta"
            size="lg"
            className="min-h-[50px] self-stretch mt-xl"
            testID={ContactSelectorSelector.Settings}
        />
    );
};
