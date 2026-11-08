import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { MAX_CHROME_FONT_SIZE_MULTIPLIER } from '../../constant/max-chrome-font-size-multiplier.constant';
import { openAppSettings } from '../../utils/open-app-settings.util';
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
            onPress={openAppSettings}
            variant="cta"
            size="lg"
            className="min-h-[50px] self-stretch mt-xl"
            testID={ContactSelectorSelector.Settings}
        />
    );
};
